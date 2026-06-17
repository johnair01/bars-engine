# Spec: Book Launch Paywall (Gumroad access codes)

## Purpose

Gate the `/handbook` digital reader behind a purchase so the book *Mastering the Game of Allyship* (MtGoA) can be sold and marketed. A reader buys on **Gumroad**, receives a **license key**, and redeems it on the site to unlock the full reader **and** a downloadable copy. Readers without a key see a "Buy on Gumroad" call-to-action. The Prologue (`front-of-book`) stays **free** as the marketing funnel.

**Problem**: The reader is production-ready but 100% public, and there is no payment/entitlement layer. Nothing today converts a Gumroad sale into in-app access, so the book cannot be sold.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. No model calls on the purchase path.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Payment rail | **Gumroad**, verified via its `v2/licenses/verify` API (a unique license key is auto-issued per sale). No pre-minted codes, no required webhook for v1 — keeps the keystone shippable in ~1 day. |
| Entitlement record | New **`BookEntitlement`** model, keyed `(playerId, bookKey)`, recording `licenseKey`, `gumroadSaleId`, `status`, `source`. Modeled on the proven `Invite` redemption pattern (`acceptGoldenPathInvitation`). |
| What a purchase unlocks | **Both** — full in-app reader access **and** a downloadable book file. (Per product decision 2026-06-12.) |
| Free sample | The Prologue chapter (`front-of-book`) is readable without entitlement; all other chapters require it. Free chapter set is config (`FREE_CHAPTER_IDS`). |
| Download delivery | Entitled players fetch the book file via a gated **Route Handler** that streams from **Vercel Blob** (no `public/` write). The file itself is produced by the **PDF/EPUB export pipeline** (dependency — see § Dependencies). |
| Account requirement | Redemption requires a logged-in Player (so the entitlement attaches to identity). Logged-out readers are routed to sign in, then redeem. The free Prologue needs no account. |
| Sharing control | Gumroad `uses` count is capped (`GUMROAD_MAX_USES`, default 3); re-verification on each gate check passes `increment_uses_count=false`. Refunds revoke via optional webhook (Phase 2). |
| Deck | **Out of scope.** The allyship deck ships as a separate/free product (see companion spec `deck-print-export`). |

## Conceptual Model

This is a **commerce/access layer**, not a play-loop feature — it gates WHO can read WHAT (the book).

| Dimension | Mapping |
|-----------|---------|
| **WHO** | The Player (must be logged in to hold an entitlement). |
| **WHAT** | `BookEntitlement` — the right to read + download a `Book` (`bookKey = "mtgoa"`). |
| **WHERE / Energy / Moves** | n/a — no quest, vibeulon, or move semantics. Access is binary. |

Flow:

```
Gumroad sale ──> license key ──> /handbook/unlock (logged-in)
   └─ redeemBookLicense(key) ─> verify w/ Gumroad ─> BookEntitlement(active)
        ├─ reader: free Prologue ──────────────> gated chapters unlock
        └─ GET /api/handbook/download ─────────> streams book file (Blob)
   no key ──> paywall CTA ──> Gumroad product page
```

## API Contracts (API-First)

### `redeemBookLicense` (Server Action)

**Input**: `{ licenseKey: string }` (current player from session)
**Output**: `{ success: true; bookKey: string } | { error: string } | { needsLogin: true }`

```ts
// 'use server'
async function redeemBookLicense(input: { licenseKey: string }): Promise<RedeemResult>
// Verifies via Gumroad, upserts BookEntitlement(playerId, bookKey),
// returns { needsLogin } when no session, { error } on invalid/refunded/over-use.
```

### `hasBookAccess` / `requireBookAccess` (server helpers, `src/lib/book-access.ts`)

```ts
function hasBookAccess(player: Player | null, bookKey?: string): Promise<boolean>
function requireBookAccess(bookKey?: string): Promise<Player>  // redirect to /handbook/unlock if not entitled
```

### `GET /api/handbook/download` (Route Handler)

**Auth**: `getCurrentPlayer()` + `hasBookAccess`. **Output**: streams the book file (`application/pdf` / `application/epub+zip`) from Blob, or `403` JSON when not entitled. External-facing binary delivery → Route Handler, not Server Action.

### `POST /api/gumroad/webhook` (Route Handler — Phase 2, optional)

**Input**: Gumroad sale/refund ping (form-encoded). Validates shared secret query param; on `refunded`/`disputed` sets matching `BookEntitlement.status = 'revoked'`. Returns `200` always (Gumroad retries on non-2xx). Pre-creates entitlements on sale for friction-free redeem.

> Route vs Action: redemption is a **Server Action** (form + `useTransition`); download and webhook are **Route Handlers** (binary stream / external POST). See deftness-development reference — Route vs Action Decision Tree.

## User Stories

### P1: Redeem a license key

**As a reader who bought on Gumroad**, I want to enter my license key on the site, so the full book unlocks for my account.
**Acceptance**: At `/handbook/unlock`, entering a valid key creates an active `BookEntitlement` and routes me into the reader with all chapters unlocked. Invalid/refunded/over-used keys show a clear error. Logged-out users are prompted to sign in first, preserving the key.

### P2: Free Prologue, gated chapters

**As a prospective buyer**, I want to read the Prologue free and hit a paywall on later chapters, so I can sample before buying.
**Acceptance**: `front-of-book` renders for anyone. Navigating to any other chapter without entitlement renders the paywall CTA (with Gumroad link + "I have a code") instead of the chapter.

### P3: Download the book

**As an entitled reader**, I want to download a PDF/EPUB copy, so I own an offline version.
**Acceptance**: A "Download" affordance in the reader calls `/api/handbook/download`; entitled players receive the file; non-entitled get `403`.

### P4: Buy from the site

**As a reader without a code**, I want a clear path to purchase, so I can buy and then unlock.
**Acceptance**: The paywall CTA links to the Gumroad product (`GUMROAD_PRODUCT_URL`) and to `/handbook/unlock`.

### P5: Verification quest (see § Verification Quest)

## Functional Requirements

### Phase 1: Entitlement + redemption (keystone — marketing-able)
- **FR1**: `BookEntitlement` model + migration (see § Persisted data).
- **FR2**: `redeemBookLicense` server action verifies the key against Gumroad `v2/licenses/verify` (product id from env), rejects `refunded`/`disputed` and over-`uses`, upserts an entitlement on `(playerId, bookKey)`.
- **FR3**: `hasBookAccess` / `requireBookAccess` helpers in `src/lib/book-access.ts`.
- **FR4**: `/handbook/unlock` page — key input form, error states, `needsLogin` → sign-in redirect that returns to unlock.
- **FR5**: Gate the reader: free `FREE_CHAPTER_IDS` (default `["front-of-book"]`); all other chapter loads require entitlement, else render `PaywallCTA`.
- **FR6**: `PaywallCTA` component — Gumroad buy link + "I have a code" → `/handbook/unlock`.

### Phase 2: Download delivery ("Both")
- **FR7**: `GET /api/handbook/download` streams the book file from Blob to entitled players (`403` otherwise).
- **FR8**: "Download" affordance in `HandbookReader` for entitled players only.
- **FR9**: Env-configured `BOOK_FILE_BLOB_KEY` (path/URL of the generated file). Depends on the PDF/EPUB export pipeline producing it.

### Phase 3: Sale/refund sync (optional hardening)
- **FR10**: `POST /api/gumroad/webhook` pre-creates entitlements on sale and revokes on refund/dispute, secret-guarded.
- **FR11**: Admin view/list of entitlements + manual comp grant (`source = 'admin'`).

## Non-Functional Requirements

- **Security**: License keys and Gumroad token never reach the client. Verify server-side only. Webhook secret-guarded. Download endpoint authorizes every request.
- **Resilience**: Gumroad API failure on redeem → graceful retry-able error, no partial entitlement. Gate checks fail **closed** (deny) on unexpected errors, except the always-free Prologue.
- **Backward compat**: `/handbook` keeps working for the free Prologue; only non-free chapters change behavior.
- **No AI on the purchase path** — fully deterministic.

## Persisted data & Prisma (required — schema changes)

> Shipping a schema change without a committed migration breaks `migrate deploy`. See [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md).

New model:

```prisma
model BookEntitlement {
  id            String    @id @default(cuid())
  playerId      String
  bookKey       String    @default("mtgoa")
  source        String    @default("gumroad") // gumroad | admin | comp
  licenseKey    String?
  gumroadSaleId String?
  status        String    @default("active")  // active | revoked | refunded
  grantedAt     DateTime  @default(now())
  revokedAt     DateTime?
  metadata      String?                       // JSON: purchaser email, product id, uses
  player        Player    @relation("PlayerBookEntitlements", fields: [playerId], references: [id])

  @@unique([playerId, bookKey])
  @@unique([bookKey, licenseKey])
  @@map("book_entitlements")
}
```

Plus `Player`: `bookEntitlements BookEntitlement[] @relation("PlayerBookEntitlements")`.

| Check | Done |
|-------|------|
| Prisma models/fields named in **Design Decisions** + **API Contracts** | ✅ |
| `tasks.md` includes `prisma migrate dev --name add_book_entitlement` + commit `prisma/migrations/…` with `schema.prisma` | ✅ (T2) |
| Verification: `npm run db:sync` after schema edit; `npm run check` | ✅ (tasks) |
| Human glances at `migration.sql` (additive — one new table + FK) | pending impl |

## Scaling Checklist (external API, filesystem, env)

| Touchpoint | Mitigation |
|------------|------------|
| Gumroad API (redeem + gate) | Server-only; cache gate result per request (`react/cache`); `increment_uses_count=false` on re-checks; feature-flag verify with `GUMROAD_VERIFY_MODE` (`live`/`mock`) for tests. |
| Book file delivery | Vercel **Blob**, never `public/` write in serverless; stream, don't buffer whole file in memory where avoidable. |
| Env | Document in spec + `docs/ENV_AND_VERCEL.md`: `GUMROAD_PRODUCT_ID`, `GUMROAD_PRODUCT_URL`, `GUMROAD_MAX_USES`, `GUMROAD_ACCESS_TOKEN` (Phase 3), `GUMROAD_WEBHOOK_SECRET` (Phase 3), `BOOK_FILE_BLOB_KEY`, `GUMROAD_VERIFY_MODE`. |

## Verification Quest (required — UX feature)

- **ID**: `cert-book-launch-paywall-v1`
- **Frame**: Bruised Banana Fundraiser — "Verify the book paywall so backers can unlock *Mastering the Game of Allyship* and fund the residency."
- **Steps** (one Twine passage each; final passage no-link → mints reward):
  1. Open `/handbook` and read the free Prologue.
  2. Navigate to a gated chapter → confirm the paywall CTA appears.
  3. Go to `/handbook/unlock`, enter a (mock-mode) test key → confirm success.
  4. Return to the gated chapter → confirm it now renders.
  5. Trigger Download → confirm an entitled download succeeds.
- **Structure**: TwineStory + `CustomBar` `isSystem: true`, `visibility: 'public'`, id `cert-book-launch-paywall-v1`, idempotent seed. Reference: [cyoa-certification-quests](../cyoa-certification-quests/), [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## Dependencies

- **PDF/EPUB export pipeline** (companion: `pdf-export-pipeline` / backlog HCP-adjacent) — produces the downloadable book file for Phase 2. Phase 1 (reader gating) does **not** depend on it and can ship first.
- **Handbook content pipeline** (companion: `handbook-content-pipeline`) — md→chapter-JSON + multi-chapter nav; without more chapters the paywall gates a thin book. Not a hard code dependency, but a launch dependency.
- Existing: `Invite` redemption pattern, `getCurrentPlayer`/`isGameAccountReady` ([src/lib/auth.ts](../../../src/lib/auth.ts)), Vercel Blob usage in [src/actions/assets.ts](../../../src/actions/assets.ts).

## References

- Reader: [src/components/handbook/HandbookReader.tsx](../../../src/components/handbook/HandbookReader.tsx), [src/lib/handbook/content.ts](../../../src/lib/handbook/content.ts)
- Pattern: [src/actions/invitations.ts](../../../src/actions/invitations.ts) (`acceptGoldenPathInvitation`)
- Gumroad license verify: `POST https://api.gumroad.com/v2/licenses/verify` (`product_id`, `license_key`, `increment_uses_count`)
- Prisma workflow: [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md); [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc)
