# Mastering Allyship — Launch Plan (MAL)

> **Goal:** raise **$800 in one week** via preorders/sales, with a working set of
> things to offer people at launch. Anchored to the **July 18** book-launch /
> fundraiser / non-profit-launch party (clothing swap, dance, livestreamed talk,
> app barn-raising/demo, livestreamed podcasts that help finish the book).

Last updated: 2026-06-12. Owner: Wendell.

## Commerce model

**Phase 1 (now): Gumroad hosts checkout.** The book and each app feature carry a
link that drops the buyer into the app's goodies. **Phase 2 (later): in-app
Stripe checkout** for the same SKUs. The unlock spine (Track A) is provider-
agnostic so Gumroad now / Stripe later both feed the same entitlement.

## SKUs & pricing (canonical)

Single source of truth in code: [`src/lib/launch/offers.ts`](../../src/lib/launch/offers.ts).
Offer page: [`/launch`](../../src/app/launch/page.tsx).

| SKU (`OfferKey`) | Offer | Price | Notes |
| :--- | :--- | :--- | :--- |
| `book-digital` | Mastering Allyship — Digital | **PWYW, anchor $15** | **Grants 30 days of app access** |
| `rpg-handbook-digital` | RPG Handbook — Digital | **$30** | |
| `deck-digital` | Oracle Deck — Digital access | **$10** | Also included in the game subscription |
| `game-subscription` | The Game — Monthly | **$10/mo** | Includes digital book **+ digital deck access** |
| `book-physical` | Mastering Allyship — Physical | **$25** | Preorder; ships after print run |
| `rpg-handbook-physical` | RPG Handbook — Physical | **$49** | Preorder; ships after print run |
| `founding-ally` | **★ Founding Ally Bundle** | **$150** | Physical book + deck access + Allyship enamel pin + physical RPG handbook + **lifetime app access** |

**Path to $800:** ~6 Founding Ally bundles ($900); or a mix, e.g. 3 bundles
($450) + 4 physical books ($196) + 5 digital handbooks ($150) ≈ **$796** — plus
recurring $10/mo subscriptions stacking afterward.

**Gumroad wiring** — set per product in Vercel as each is created (offer renders
a "setup pending" state until its URL exists, so the page ships now):

```
NEXT_PUBLIC_GUMROAD_FOUNDING_ALLY_URL
NEXT_PUBLIC_GUMROAD_BOOK_DIGITAL_URL      NEXT_PUBLIC_GUMROAD_BOOK_PHYSICAL_URL
NEXT_PUBLIC_GUMROAD_RPG_DIGITAL_URL       NEXT_PUBLIC_GUMROAD_RPG_PHYSICAL_URL
NEXT_PUBLIC_GUMROAD_DECK_DIGITAL_URL      NEXT_PUBLIC_GUMROAD_GAME_SUB_URL
```

## Parallel tracks

### Track D — Launch/offer page ✅ SHIPPED
`/launch` public funnel (no auth), covenant-compliant CultivationCard grid,
Founding Ally hero + digital/physical groups, PWYW control for the digital book.
Files: `src/lib/launch/offers.ts`, `src/app/launch/page.tsx`,
`src/app/launch/LaunchOffers.tsx`. (Verified: tsc + eslint + build-reliability
clean; `next build` only blocked locally by sandbox Google-Fonts egress.)

### Track B — Deck export ✅ SHIPPED (v1)
`npm run deck:export-pdf [--difficulty=easy|medium|hard] [--max-px] [--jpeg-quality]`
→ print-ready PDF from `public/oracle/deck.json` (52 cards, poker size + 0.125"
bleed, full-bleed art + title/suit/flavor/prompt panel). pdf-lib + sharp; no
network (sandbox-safe). ~7.5 MB at default 900px/q82. Output `exports/` (gitignored).
Script: `scripts/export-oracle-deck-pdf.ts`.
**Next (B2):** apply per-card `crop` metadata; card-back sheet; per-card PNG export
+ zip for The Game Crafter / MPC; cut/safe guides.

### Track A — Commerce spine — v1 SHIPPED (code), DEPLOY PENDING
The "buy on Gumroad → unlock app goodies" flow. Built **additively** (the dead
`RedemptionPack` is left untouched — removable later):
- **Schema + migration:** `Entitlement` + `RedemptionCode`
  (`prisma/migrations/20260612230000_add_entitlement_redemption_code/`) — two
  new tables + one FK to `players`, **no drops/alters** (non-destructive).
- **Grant config:** `src/lib/launch/grants.ts` — SKU → grant type/duration +
  bundled capabilities (book-digital ⇒ 30-day `app-access`; game-subscription ⇒
  app-access + book + deck; founding-ally ⇒ lifetime app-access + deck).
- **Service:** `src/lib/entitlements/service.ts` — `mintRedemptionCode`,
  `redeemCode` (atomic, idempotent), `grantEntitlement`, `getActiveEntitlements`,
  `hasCapability` / `hasAppAccess`.
- **Actions:** `src/actions/entitlements.ts` — `redeemLaunchCode` (buyer),
  `mintLaunchCode` (admin, week-one manual fulfillment).
- **UI:** `/redeem` page + form (auth-aware, `?code=` prefill).

**Deploy step (needs a DB — run in an env with `DATABASE_URL`):**
`npx prisma migrate deploy` → `npm run db:record-schema-hash`.

**Track A remaining:** Gumroad webhook → `mintRedemptionCode` (auto-mint on sale)
+ delivery of the code/link to buyers; wire `hasCapability`/`hasAppAccess` gates
into the app's paid surfaces (game/deck/handbook reading); admin mint UI; later,
remove the `RedemptionPack` scaffold in a deliberate cleanup.

### Track C — Book + RPG handbook deliverables — NOT STARTED
Polish `.specify/books/book-mtgoa.txt` → digital book (PDF/EPUB); compile the
scattered rules (`mtgoa-game/src/engine/rules.ts`, `FOUNDATIONS.md`,
`ARCHITECTURE.md`, wiki handbook) into one RPG handbook PDF. Feeds physical
preorders + the digital book/handbook SKUs.

## Track A design decision — entitlement primitive

**Finding (investigated 2026-06-12):** `RedemptionPack` (`prisma/schema.prisma`
~L2378, `@@map("redemption_packs")`) is a **dead scaffold** — added in schema
only (merge `a9f47cf`, Book OS v1), **never migrated**, **never instantiated**.
No API/action/UI; the live donation flow (`src/actions/donate.ts`) mints
vibeulons directly and never writes a pack row. Its original intent was a
donation→**vibeulon** honor-system reward (instance- + player-scoped), not a
product entitlement.

**Why it's the wrong shape for Gumroad→unlock:** requires `playerId` (no
pre-account purchase), requires `instanceId` (entitlements are account/global),
denominated in `vibeulonAmount` (not SKU), and has **no redemption code, no SKU
field, no expiry/time-box, no external order id.**

**Recommendation: REDESIGN** — delete `RedemptionPack` (+ its 3 back-refs and
snapshot/restore entries; no data/down-migration cost) and add an
`Entitlement` + `RedemptionCode` pair keyed to the existing `OfferKey` SKUs.

```prisma
model Entitlement {
  id              String    @id @default(cuid())
  playerId        String                          // claimed owner (set at redemption)
  sku             String                          // OfferKey from src/lib/launch/offers.ts
  grantType       String    @default("perpetual") // perpetual | timeboxed | subscription
  status          String    @default("active")    // active | expired | revoked
  source          String    @default("gumroad")
  externalOrderId String?                          // Gumroad sale id (idempotency)
  startsAt        DateTime  @default(now())
  expiresAt       DateTime?                        // e.g. now + 30d for book → app access
  metadata        Json?
  createdAt       DateTime  @default(now())
  player          Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  @@unique([playerId, sku, externalOrderId])
  @@index([playerId, status])
  @@index([sku, status])
  @@map("entitlements")
}

model RedemptionCode {
  id                 String    @id @default(cuid())
  code               String    @unique
  sku                String                          // OfferKey to grant
  grantType          String    @default("perpetual")
  grantDurationDays  Int?                            // timeboxed: expiresAt = redeemedAt + N
  source             String    @default("gumroad")
  externalOrderId    String?   @unique
  status             String    @default("unredeemed") // unredeemed | redeemed | void
  redeemedByPlayerId String?
  entitlementId      String?   @unique
  expiresAt          DateTime?                        // claim deadline (≠ grant expiry)
  metadata           Json?
  createdAt          DateTime  @default(now())
  redeemedAt         DateTime?
  @@index([sku, status])
  @@map("redemption_codes")
}
```

**Flow:** Gumroad sale → webhook/admin mints a `RedemptionCode` (`sku` +
`externalOrderId`) → buyer redeems at `/redeem?code=…` (sign in/up) → server
marks code redeemed, creates `Entitlement` (timeboxed → `expiresAt =
redeemedAt + grantDurationDays`; **`book-digital` ⇒ 30 days**) → feature gating
checks `Entitlement` (active AND not expired). Decouples purchase from account,
SKU-denominated, time-boxable, idempotent on order id.

**A2 steps:** (1) remove `RedemptionPack` + back-refs; (2) add models +
`Player.entitlements`; (3) `npx prisma migrate dev`; (4) `redeemCode` action +
`/redeem` route + `hasEntitlement(sku)` helper; (5) gate `/launch` unlocks and
game/handbook/deck access; (6) Gumroad webhook to mint codes (or manual admin
mint for week-one).
