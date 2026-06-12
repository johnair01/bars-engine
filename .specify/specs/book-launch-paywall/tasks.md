# Tasks: Book Launch Paywall

Implements [spec.md](./spec.md) per [plan.md](./plan.md). Order is API-first. Check off as completed.

## Phase 1 — Entitlement + redemption (keystone, marketing-able)

- [ ] **T1** — Add `BookEntitlement` model + `Player.bookEntitlements` relation to `prisma/schema.prisma` (spec § Persisted data).
- [ ] **T2** — `npx prisma migrate dev --name add_book_entitlement`; **commit** `prisma/migrations/<ts>_add_book_entitlement/` together with `schema.prisma`. Then `npm run db:sync` + `npm run db:record-schema-hash`. Human-glance the `migration.sql` (additive: one table + FK).
- [ ] **T3** — `src/lib/gumroad.ts`: `verifyLicense(key, opts)` with live (`v2/licenses/verify`) + mock (`GUMROAD_VERIFY_MODE=mock`) branches; reject invalid/refunded/over-uses.
- [ ] **T4** — `src/lib/book-access.ts`: `FREE_CHAPTER_IDS`, `hasBookAccess(player, bookKey?)`, `requireBookAccess(bookKey?)` (fail-closed, free chapters bypass).
- [ ] **T5** — `src/actions/book-entitlement.ts`: `redeemBookLicense({ licenseKey })` — `{ success } | { error } | { needsLogin }`; verify → upsert `BookEntitlement(playerId, bookKey)` in a transaction. Unit-test branches.
- [ ] **T6** — `src/app/handbook/unlock/page.tsx`: key-entry form (client + `useTransition`), error states, `needsLogin` → sign-in then return to `/handbook/unlock`.
- [ ] **T7** — `src/components/handbook/PaywallCTA.tsx`: Gumroad buy link (`GUMROAD_PRODUCT_URL`) + "I have a code" → `/handbook/unlock`.
- [ ] **T8** — Gate non-free chapters in the reader route/loader: `FREE_CHAPTER_IDS` render as today; others require `hasBookAccess`, else render `PaywallCTA`. Add a test asserting Prologue is always free.
- [ ] **T9** — `docs/ENV_AND_VERCEL.md`: document `GUMROAD_PRODUCT_ID`, `GUMROAD_PRODUCT_URL`, `GUMROAD_MAX_USES`, `GUMROAD_VERIFY_MODE`.
- [ ] **T10** — `npm run build` + `npm run check` (fail-fix). Smoke: free Prologue, gated chapter → CTA, redeem `TEST-` key → unlock.

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

- [ ] **T18** — Twine story `cert-book-launch-paywall-v1` (5 passages, spec § Verification Quest); final passage no-link.
- [ ] **T19** — `scripts/seed-cert-book-launch-paywall.ts` (idempotent; `CustomBar` `isSystem:true`, `visibility:'public'`, id `cert-book-launch-paywall-v1`) + `npm run seed:cert:book-paywall` in `package.json`. Uses mock-mode `TEST-` key for the redeem step.
- [ ] **T20** — Run the quest end-to-end in preview; confirm reward mints on the final passage.

## Definition of done

- [ ] Migration committed with schema; `db:record-schema-hash` updated.
- [ ] `npm run build` + `npm run check` green.
- [ ] Free Prologue public; gated chapters require entitlement; redeem + download verified.
- [ ] Verification quest seeded and passing.
- [ ] BACKLOG row `1.78 BLP` checked off; `npm run backlog:seed` run.
