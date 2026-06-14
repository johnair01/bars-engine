# Prompt: Book launch paywall — Gumroad access codes (1.78 BLP)

Implement per the spec kit:

- **Spec:** [.specify/specs/book-launch-paywall/spec.md](../../specs/book-launch-paywall/spec.md)
- **Plan:** [plan.md](../../specs/book-launch-paywall/plan.md)
- **Tasks:** [tasks.md](../../specs/book-launch-paywall/tasks.md) — **Phase 1 before Phase 2 before Phase 3**

## Objective

Gate the `/handbook` digital reader behind a Gumroad purchase so *Mastering the Game of Allyship* can be sold. A reader buys on Gumroad, gets a license key, redeems it on the site, and unlocks the full reader **and** a downloadable copy. No code → "Buy on Gumroad" CTA. The Prologue (`front-of-book`) stays free.

## Agent instructions (API-first)

1. **T1–T2**: Add `BookEntitlement` model + `Player.bookEntitlements`; `prisma migrate dev --name add_book_entitlement`; commit `prisma/migrations/…` with `schema.prisma`; `db:sync` + `db:record-schema-hash`. Read [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md).
2. **T3–T5**: `src/lib/gumroad.ts` (`verifyLicense`, live + `GUMROAD_VERIFY_MODE=mock`), `src/lib/book-access.ts` (`hasBookAccess`/`requireBookAccess`/`FREE_CHAPTER_IDS`, fail-closed), `src/actions/book-entitlement.ts` (`redeemBookLicense`). Clone the `acceptGoldenPathInvitation` redemption shape.
3. **T6–T8**: `/handbook/unlock` redeem form, `PaywallCTA`, gate non-free chapters in the reader.
4. **Phase 2 (T11–T14)**: gated `/api/handbook/download` Blob stream + reader Download affordance (depends on `BOOK_FILE_BLOB_KEY` from the PDF pipeline, **1.80 DPX**).
5. **Phase 3 (T15–T17, optional)**: refund webhook + admin entitlement list.
6. Run `npm run build` && `npm run check` (fail-fix); implement + run **Verification Quest** `cert-book-launch-paywall-v1` (T18–T20).
7. Check off `tasks.md`; update the `1.78 BLP` row in `BACKLOG.md`; `npm run backlog:seed`.

## Decisions already made (2026-06-12)

- Purchase unlocks **Both** (in-app reader + downloadable file).
- The allyship **deck is separate/free** — out of scope here (see **1.80 DPX**).

## Env to add (document in docs/ENV_AND_VERCEL.md)

`GUMROAD_PRODUCT_ID`, `GUMROAD_PRODUCT_URL`, `GUMROAD_MAX_USES`, `GUMROAD_VERIFY_MODE`, `BOOK_FILE_BLOB_KEY` (Phase 2), `GUMROAD_ACCESS_TOKEN` + `GUMROAD_WEBHOOK_SECRET` (Phase 3).
