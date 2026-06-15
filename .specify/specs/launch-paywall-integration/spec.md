# Launch × Paywall Integration — Phase 1 (book sellable on one model)

> **Status:** Phase 1 IMPLEMENTED. Phases 2–3 deferred (see end).
> Branch: `claude/lpi-book-sellable`.

## Problem

The launch merge left **two disjoint entitlement systems** for the same product:

- **BLP** — `BookEntitlement` (perpetual), `hasBookAccess()` reads it, `redeemBookLicense()`
  verifies a Gumroad license (`verifyLicense`, `GUMROAD_PRODUCT_ID`) and writes it. Gates `/handbook`.
- **Launch / Track A** — `Entitlement` + `RedemptionCode`, `hasCapability()`/`grantEntitlement()`,
  multi-SKU `offers.ts`, a Gumroad webhook that mints a code per sale, redeemed at `/redeem`.

The **same license key gave different results** depending on where it was entered:
`/handbook/unlock` → perpetual `BookEntitlement` (reader unlocks; **no** app access / downloads);
webhook→`/redeem` → timeboxed `Entitlement('book-digital')` (app access + downloads; **reader stays locked**,
because `hasBookAccess` read `BookEntitlement`, not `Entitlement`).

## Decision

Unify on the launch **`Entitlement`** model. Retire `BookEntitlement` (table left in place,
non-destructive — stop reading/writing it). A verified Gumroad book license now grants the
same `Entitlement('book-digital')` the webhook path produces, so a key resolves **identically**
wherever it's entered.

### Book ownership vs app trial (product decision: "30-day app trial, as designed")

The digital-book offer promises perpetual book ownership **and** "a 30-day key into the app".
A single entitlement can't carry two different lifetimes, so we split the *read* by intent
**without any schema/SKU change**:

- `book-digital` stays **timeboxed-30** and keeps conferring `app-access` → the 30-day app
  trial (`/play`, `/deck`) lapses correctly via the existing capability-expiry path.
- The **reader** (`/handbook`) gates on **ownership**: an active `book-digital` entitlement
  **ignoring `expiresAt`**. You own the book forever even after the app window closes.
- **Bundle / subscription** holders (Founding Ally, game subscription, physical book) read via
  `hasCapability('book-digital')` for as long as that grant is live.
- Refund/chargeback → the webhook sets the entitlement `status: revoked` → both reads fail closed.

## What changed (Phase 1)

| File | Change |
|------|--------|
| `src/lib/book-access.ts` | `hasBookAccess` resolves via `Entitlement`: ownership query (ignores expiry) + `hasCapability('book-digital')` fallback for bundles. No longer touches `BookEntitlement`. |
| `src/actions/book-entitlement.ts` | `redeemBookLicense` verifies the license then `grantEntitlement('book-digital', externalOrderId=saleId)` (idempotent on the sale id); idempotent pre-check by SKU ownership. Revalidates `/downloads` too. |

`verifyLicense` (book `GUMROAD_PRODUCT_ID`), the webhook, `/redeem`, `/handbook/unlock`, and the
capability/grant maps are unchanged. The two unlock surfaces now produce the **same** entitlement.

## Verification

- `npm run check` — 0 errors. `book-launch-paywall` unit test green.
- Behavior: a book buyer who unlocks at `/handbook/unlock` **or** `/redeem` gets the reader,
  the downloadable copy, and a 30-day app trial; the reader persists after the trial lapses;
  bundle holders read while their grant is live.

## Deferred

- **Phase 2** — per-SKU Gumroad products so `verifyLicense` can unlock the deck / handbook / etc.
  by license too (today `verifyLicense` targets the single book `GUMROAD_PRODUCT_ID`).
- **Phase 3** — drop the now-unused `BookEntitlement` model + migration; consolidate the duplicate
  unlock surfaces (`/handbook/unlock` ↔ `/redeem`) and paywall components into one.
