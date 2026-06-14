# Tasks: Barn Raising — Live Data

> Follow in order. Check off as completed. Run `npm run build` + `npm run check` before done.

## Phase 1 — Schema + seed
- [ ] **T1.1** Add `wallKey String?` + `@@index([campaignRef, wallKey])` to `CampaignMilestone` in `prisma/schema.prisma`.
- [ ] **T1.2** `npx prisma migrate dev --name milestone_wall_key` — review `migration.sql` (additive: one nullable column + index).
- [ ] **T1.3** Commit `prisma/migrations/…` **with** `schema.prisma`; run `npm run db:record-schema-hash`; `npm run db:generate`.
- [ ] **T1.4** Add `BARN_CAMPAIGN_REF` to `src/lib/event/barn-raising.ts`; ensure `BARN_WALLS` targets match seed values.
- [ ] **T1.5** Write `scripts/seed-barn-raising.ts` (idempotent upsert of event Instance + 3 wall milestones); add `"seed:barn"` to `package.json`. Run it; verify rows.

## Phase 2 — Read path
- [ ] **T2.1** Create `src/actions/barn.ts` → `getBarnSnapshot(campaignRef): Promise<BarnSnapshot>` (3 milestone reads + offer-BAR hands/beams counts; cents conversion).
- [ ] **T2.2** Unit test cents conversion + hands/beams aggregation (`getBarnSnapshot`).
- [ ] **T2.3** Wire `/event/barn/page.tsx` to `getBarnSnapshot` (try/catch → `EMPTY_BARN_STATE`); keep `?preview=1` override.
- [ ] **T2.4** `/pricing` teaser reads live snapshot best-effort (never blocks the page).

## Phase 3 — Write path (checkout tagging)
- [ ] **T3.1** `/event/donate/page.tsx` reads `product`/`variant`/`wall` search params; pass into the self-report form.
- [ ] **T3.2** `src/actions/donate.ts` persists `product`/`variant`/`wall` into `Donation.dswMeta`.
- [ ] **T3.3** Extend `recordContribution` (`src/actions/campaign-deck.ts`) with optional `wallKey?`/`product?`; resolve the matching wall milestone; default pre-sale.
- [ ] **T3.4** Wall-complete "keep building" redirect (FR6) via `CampaignMilestoneGuidance` pattern.

## Phase 4 — Verification quest (required)
- [ ] **T4.1** Author Twine passages for `cert-barn-raising-live-v1` (4 steps; final no link).
- [ ] **T4.2** `scripts/seed-cert-barn-raising-live.ts` + `"seed:cert:barn-raising-live"` npm script (idempotent; `isSystem`, `visibility: 'public'`).
- [ ] **T4.3** Run the quest end-to-end; confirm pre-sale wall rises and reward mints.

## Phase 5 — Fail-fix
- [ ] **T5.1** `npm run build`.
- [ ] **T5.2** `npm run check` (lint + tsc).
- [ ] **T5.3** Update `tasks.md` checkmarks; note any deferrals.
