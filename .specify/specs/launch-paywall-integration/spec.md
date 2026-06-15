# Launch × Paywall Integration (book sellable on one model)

> **Status:** Phases 1–3 IMPLEMENTED.
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

## What changed (Phase 2 — per-SKU license verification)

Every SKU can now be unlocked by its Gumroad license key, not just the book.

| File | Change |
|------|--------|
| `src/lib/gumroad.ts` | `verifyLicense(key, { sku })` resolves the product id from `GUMROAD_PRODUCT_ID_<SKU>` (book-digital still honours the legacy `GUMROAD_PRODUCT_ID`). New `resolveLicense(key)` probes a bare key across every configured SKU and returns the one it belongs to — incrementing the use counter only on the matching product (wrong products return `invalid` and never increment). |

## What changed (Phase 3 — one unlock surface, retire BookEntitlement)

| File | Change |
|------|--------|
| `src/actions/entitlements.ts` | `redeemLaunchCode` now accepts a minted code **or** a raw license key: try `redeemCode`, then fall back to `resolveLicense` + `grantEntitlement`. |
| `src/app/redeem/*` | `/redeem` is the single unlock surface — copy covers "code or license key"; a validated `?next=` param routes the buyer onward (and survives login) and auto-routes on success. |
| `src/app/handbook/unlock/page.tsx` | Now a redirect to `/redeem?next=/handbook` (bookmarks + the verification quest still land right). `UnlockForm` and the `redeemBookLicense` action are deleted; `requireBookAccess` and `PaywallCTA` point at `/redeem?next=/handbook`. |
| `prisma/schema.prisma` + migration | `BookEntitlement` model + the `Player` relation removed; `…_drop_book_entitlement` migration drops the `book_entitlements` table. |

## Verification

- `npm run check` — 0 errors; `npm run build` clean; `book-launch-paywall` unit test green.
- `prisma validate` passes; drop migration generated DB-free via `migrate diff` and applies on
  the next `db:migrate:deploy` (could not be applied here — no DB in the build container).
- Behavior: a buyer who unlocks at `/handbook/unlock` (→ `/redeem`) **or** `/redeem` directly,
  with a minted code **or** a Gumroad license key, gets the reader, the downloadable copy, and a
  30-day app trial; the reader persists after the trial lapses; bundle holders read while live.

## Follow-ups (not blocking)

- Set `GUMROAD_PRODUCT_ID_<SKU>` for the non-book SKUs to light up their license-verify fallback.
- A license redeemed via the `resolveLicense` fallback for a *subscription* SKU has no
  `subscriptionId` link, so it won't auto-renew — acceptable degradation for a missed webhook.
