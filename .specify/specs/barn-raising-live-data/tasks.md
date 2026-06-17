# Tasks: Barn Raising — Live Data

> Follow in order. Check off as completed. Run `npm run build` + `npm run check` before done.
>
> **Slice 1 (this branch `claude/barn-raising-live-data`):** schema + migration + seed +
> read path (the barn now moves on real milestone totals) + unit test + verification quest.
> **Slice 2 (deferred):** the donate write-path wall-tagging (Phase 3) — left for a focused
> follow-up so the money path isn't changed blind (needs a DB to verify e2e).

## Phase 1 — Schema + seed
- [x] **T1.1** Added `wallKey String?` + `@@index([campaignRef, wallKey])` to `CampaignMilestone`.
- [~] **T1.2** Migration **hand-authored** (`prisma/migrations/20260616050000_milestone_wall_key/migration.sql`) — additive (one nullable column + index) since `migrate dev` needs a DB. **Apply locally:** `npx prisma migrate deploy` (or `migrate dev`).
- [~] **T1.3** Migration committed **with** `schema.prisma`; `prisma generate` run (client has `wallKey`). **Locally still:** `npm run db:record-schema-hash` after applying.
- [x] **T1.4** Added `BARN_CAMPAIGN_REF` (+ `WALL_KEYS`) to `src/lib/event/barn-raising.ts`; targets match `BARN_WALLS` (dollars in DB, ×100 → cents in the bar).
- [x] **T1.5** Wrote `scripts/seed-barn-raising.ts` (idempotent: event Instance + 3 wall milestones, preserves `currentValue` on reseed) + `"seed:barn"`. **Run locally:** `npm run seed:barn`.

## Phase 2 — Read path
- [x] **T2.1** `src/actions/barn.ts` → `getBarnSnapshot(campaignRef)` (3 milestone reads → cents; in-kind hands count via `barId`).
- [x] **T2.2** Unit test `src/lib/event/__tests__/barn-raising.test.ts` (cents conversion; `npm run test:barn` ✓).
- [x] **T2.3** Wired `/event/barn` to `getBarnSnapshot` (try/catch → empty `BarnState`); `?preview=1` still forces fill.
- [x] **T2.4** `/pricing` teaser live snapshot — wired to `getBarnSnapshot()` (DB-safe try/catch → empty state on DB-down). [slice 3]

## Phase 3 — Write path (checkout tagging) — SLICE 2 DONE
- [x] **T3.1** `/event/donate` reads `product`/`variant`/`wall` and forwards into the self-report form.
- [x] **T3.2** `donate.ts` persists `product`/`variant`/`wall` into `Donation.dswMeta`.
- [x] **T3.3** `donate.ts` resolves the wall milestone by `(campaignRef, wallKey)` when no `milestoneId`; product purchases default to the **pre-sale** wall (set in `checkoutHref`).
- [x] **T3.4** Wall-complete "keep building" redirect (FR6) — `keepBuildingAfterWall(state, wall)` (pure, unit-tested) surfaced via `KeepBuildingCard` in the donate success path (both pending-cookie + logged-in direct submit). [slice 3]

## Phase 4 — Verification quest (required)
- [x] **T4.1** Authored Twine passages for `cert-barn-raising-live-v1` (live walls → buy → self-report → pre-sale wall rises).
- [x] **T4.2** `scripts/seed-cert-barn-raising-live.ts` + `"seed:cert:barn-raising-live"` (idempotent; `isSystem`, public).
- [ ] **T4.3** Run the quest end-to-end (**needs DB** + slice-2 write path for the pre-sale-rise step).

## Phase 5 — Fail-fix
- [x] **T5.1/T5.2** `prisma generate` + `npm run check` pass (precommit, 0 errors); `npm run test:barn` ✓.
- [x] **T5.3** Checkmarks updated; deferrals noted (T2.4, Phase 3, T4.3).
