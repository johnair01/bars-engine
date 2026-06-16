# Tasks: Book Launch Paywall

Implements [spec.md](./spec.md) per [plan.md](./plan.md). Order is API-first. Check off as completed.

## Phase 1 — Entitlement + redemption (keystone, marketing-able)

- [x] **T1** — Add `BookEntitlement` model + `Player.bookEntitlements` relation to `prisma/schema.prisma` (spec § Persisted data).
- [~] **T2** — Migration `prisma/migrations/20260614033500_add_book_entitlement/migration.sql` authored (offline `migrate diff` needs a shadow DB; SQL is additive — table + 2 unique indexes + FK — hand-written in Prisma format) and committed with `schema.prisma`; `prisma generate` re-run. **Pending a reachable DB:** run `npx prisma migrate deploy` (or `migrate dev` to record in `_prisma_migrations`) + `npm run db:record-schema-hash`. This container has no `DATABASE_URL`.
- [x] **T3** — `src/lib/gumroad.ts`: `verifyLicense(key, opts)` with live (`v2/licenses/verify`) + mock (`GUMROAD_VERIFY_MODE=mock`) branches; reject invalid/refunded/over-uses.
- [x] **T4** — `src/lib/book-access.ts`: `FREE_CHAPTER_IDS`, `hasBookAccess(player, bookKey?)`, `requireBookAccess(bookKey?)`, `isFreeChapter` (fail-closed, free chapters bypass).
- [x] **T5** — `src/actions/book-entitlement.ts`: `redeemBookLicense({ licenseKey })` — `{ success } | { error } | { needsLogin }`; verify → upsert `BookEntitlement(playerId, bookKey)`; idempotent on re-submit.
- [x] **T6** — `src/app/handbook/unlock/page.tsx` + `UnlockForm` (client + `useTransition`), error states, `needsLogin` → `/login?returnTo=/handbook/unlock`.
- [x] **T7** — `src/components/handbook/PaywallCTA.tsx`: Gumroad buy link (`GUMROAD_PRODUCT_URL`) + "I already have a code" → `/handbook/unlock`.
- [x] **T8** — Gated `src/app/handbook/[chapterId]/page.tsx`: free chapters render the reader; others require `hasBookAccess`, else `PaywallCTA`. (Real chapter content depends on companion **1.79 HCP**; the gate seam is live now.)
- [x] **T9** — `docs/ENV_AND_VERCEL.md`: documented `GUMROAD_PRODUCT_ID`, `GUMROAD_PRODUCT_URL`, `GUMROAD_MAX_USES`, `GUMROAD_VERIFY_MODE` (+ Phase 2/3 vars).
- [x] **T10** — `npm run check` green (0 errors). Full `next build` deferred to Vercel preview CI (no DB in this container). Unit tests for `verifyLicense`/`hasBookAccess` still to add.

## Phase 2 — Download delivery ("Both")

- [ ] **T11** — `src/app/api/handbook/download/route.ts`: `getCurrentPlayer` + `hasBookAccess` → stream book file from Blob (`BOOK_FILE_BLOB_KEY`); `403` when unentitled, `404` when no file configured.
- [ ] **T12** — `HandbookReader`: Download affordance shown only to entitled players; calls the route.
- [ ] **T13** — Document `BOOK_FILE_BLOB_KEY` in `docs/ENV_AND_VERCEL.md`; note dependency on the PDF/EPUB export pipeline producing the file.
- [ ] **T14** — `npm run build` + `npm run check`.

## Phase 3 — Sale/refund sync (optional hardening)

- [ ] **T15** — `src/app/api/gumroad/webhook/route.ts`: secret-guarded; pre-create entitlement on sale, revoke on refund/dispute; always `200`.
- [ ] **T16** — `src/app/admin/books/entitlements/page.tsx`: list entitlements + manual comp grant (`source = 'admin'`).
- [ ] **T17** — Document `GUMROAD_ACCESS_TOKEN`, `GUMROAD_WEBHOOK_SECRET`.

## Verification Quest (required — do not mark UI complete without it)

- [x] **T18** — Twine story `cert-book-launch-paywall-v1` (4 Phase-1 steps + FEEDBACK + END_SUCCESS, final passage no-link). The download step (spec step 5) is appended when Phase 2 lands.
- [x] **T19** — `scripts/seed-cert-book-launch-paywall.ts` (idempotent; `CustomBar` `isSystem:true`, `visibility:'public'`, id `cert-book-launch-paywall-v1`) + `npm run seed:cert:book-paywall`. Steps use a mock-mode `TEST-` key for the redeem step.
- [~] **T20** — Run the quest end-to-end in preview; confirm reward mints on the final passage. **Pending a reachable DB** (no `DATABASE_URL` in this container) — run `npm run seed:cert:book-paywall` then complete the quest on the deployed preview.

## Phase 1.5 — Launch funnel (SKU: Gumroad PDF + reader-as-sample)

Decided 2026-06-14: sell the full book as a Gumroad-hosted PDF; the in-app reader is the free Prologue sample and gains chapters over time. The PDF is supplied by the author.

- [x] **L1** — `FooterBlock` CTA is a real link to the gated next chapter (`/handbook/chapter-one`) so the free Prologue funnels to the paywall. Dropped the "PROTOTYPE" footer note.
- [x] **L2** — `UnlockedComingSoon` panel: entitled readers opening an unauthored chapter see an honest "you're unlocked / download on Gumroad / chapters arriving" surface instead of a load error.
- [x] **L3** — `PUBLISHED_CHAPTER_IDS` / `isPublishedChapter` in `book-access`; gated route branches entitled → reader (published) vs coming-soon (not yet). Empty at launch.
- [ ] **L4 (ops, not code)** — Create the Gumroad product (license keys on; upload the PDF), set Vercel **Production** env: `GUMROAD_PRODUCT_ID`, `GUMROAD_PRODUCT_URL`, leave `GUMROAD_VERIFY_MODE` live. Seed `npm run seed:cert:book-paywall` and walk it once.

## Unit tests

- [x] **UT1** — `src/lib/__tests__/book-launch-paywall.test.ts` (`npm run test:book-paywall`): `verifyLicense` mock branches + `isFreeChapter` + `hasBookAccess(null)`. Passing.

## Definition of done

- [ ] Migration committed with schema; `db:record-schema-hash` updated.
- [ ] `npm run build` + `npm run check` green.
- [ ] Free Prologue public; gated chapters require entitlement; redeem + download verified.
- [ ] Verification quest seeded and passing.
- [ ] BACKLOG row `1.78 BLP` checked off; `npm run backlog:seed` run.
