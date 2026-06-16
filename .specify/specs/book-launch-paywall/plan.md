# Plan: Book Launch Paywall

Implements [spec.md](./spec.md). **API-first**: ship the entitlement model + `redeemBookLicense` action + gate helpers before any UI. Phase 1 is marketing-able on its own (reader gating); Phase 2 adds the download; Phase 3 hardens with webhook/refund sync.

## Architecture strategy

Clone the proven token-redemption shape from `acceptGoldenPathInvitation` ([src/actions/invitations.ts](../../../src/actions/invitations.ts)): validate an external token, check status/uses, write a record in a transaction. The only new surface is the **Gumroad verify call** and a **gate helper** layered over the existing `getCurrentPlayer` auth.

Keep all Gumroad I/O in one module (`src/lib/gumroad.ts`) so it can be mock-mode flagged (`GUMROAD_VERIFY_MODE=mock`) for tests and local dev without real sales.

## File impact

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `BookEntitlement` model + `Player.bookEntitlements` relation |
| `prisma/migrations/<ts>_add_book_entitlement/` | Generated migration (committed) |
| `src/lib/gumroad.ts` | **New** — `verifyLicense(key)` wrapping `v2/licenses/verify`; mock mode |
| `src/lib/book-access.ts` | **New** — `hasBookAccess`, `requireBookAccess`, `FREE_CHAPTER_IDS` |
| `src/actions/book-entitlement.ts` | **New** — `redeemBookLicense` server action |
| `src/app/handbook/unlock/page.tsx` | **New** — redeem form (client) + sign-in routing |
| `src/components/handbook/PaywallCTA.tsx` | **New** — buy link + "I have a code" |
| `src/app/handbook/[chapterId]/page.tsx` or reader loader | Gate non-free chapters → `PaywallCTA` |
| `src/app/api/handbook/download/route.ts` | **New** (Phase 2) — gated Blob stream |
| `src/components/handbook/HandbookReader.tsx` | Add Download affordance for entitled players (Phase 2) |
| `src/app/api/gumroad/webhook/route.ts` | **New** (Phase 3) — sale/refund sync |
| `src/app/admin/books/entitlements/page.tsx` | **New** (Phase 3) — list + comp grant |
| `docs/ENV_AND_VERCEL.md` | Document new env vars |
| `scripts/seed-cert-book-launch-paywall.ts` | **New** — verification quest seed |

## Gumroad verify contract (deterministic)

```ts
// src/lib/gumroad.ts
type VerifyResult =
  | { ok: true; saleId: string; uses: number; email?: string; refunded: boolean }
  | { ok: false; reason: 'invalid' | 'refunded' | 'over_uses' | 'network' }

async function verifyLicense(licenseKey: string, opts?: { increment?: boolean }): Promise<VerifyResult>
// live: POST https://api.gumroad.com/v2/licenses/verify
//   body: product_id=GUMROAD_PRODUCT_ID & license_key & increment_uses_count=<opts.increment ?? false>
//   reject when !success, purchase.refunded/disputed, or uses > GUMROAD_MAX_USES
// mock: accept keys matching /^TEST-/, reject /^REFUND-/, for cert + local dev
```

## Gating approach

- Reader chapter loading already keys off `chapterId`. Introduce a server boundary: the chapter route/loader calls `hasBookAccess(player)` unless `FREE_CHAPTER_IDS.includes(chapterId)`.
- Fail **closed**: any error other than "free chapter" denies and renders `PaywallCTA`.
- Logged-out + non-free chapter → `PaywallCTA` (buy + "I have a code"); the Prologue never gates.

## Verification quest

Twine story `cert-book-launch-paywall-v1` (5 passages per spec § Verification Quest) + idempotent seed `scripts/seed-cert-book-launch-paywall.ts` exposed as `npm run seed:cert:book-paywall`. Uses `GUMROAD_VERIFY_MODE=mock` so step 3 redeems a `TEST-` key without a real sale. Framed toward the Bruised Banana Fundraiser.

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Gumroad API shape drift | Single `gumroad.ts` adapter; mock mode for tests; pin to documented `v2/licenses/verify`. |
| Key sharing | `GUMROAD_MAX_USES` cap; `increment_uses_count=false` on gate re-checks so only redeem counts. |
| Download with no file yet | Phase 2 is gated behind `BOOK_FILE_BLOB_KEY` presence; absent → hide Download + return `404` not `403`. |
| Locking out the free funnel | `FREE_CHAPTER_IDS` always bypass gate; Prologue covered by a test. |

## Build / verification

- `npm run db:sync` after schema edit; `npm run build`; `npm run check` (fail-fix).
- Unit-test `verifyLicense` mock branches + `hasBookAccess` (entitled/expired/free-chapter).
- Run the verification quest end-to-end in preview before marking the UI feature done.
