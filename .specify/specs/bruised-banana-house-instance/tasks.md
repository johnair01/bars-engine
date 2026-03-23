# Tasks: Bruised Banana House Instance (Y)

## Phase 1 — Instance + seed

- [x] **Y1.1** `spec.md`, `plan.md`, `tasks.md` in `.specify/specs/bruised-banana-house-instance/`
- [x] **Y1.2** `scripts/seed-bruised-banana-house-instance.ts` — upsert `bruised-banana-house`, parent link to BB residency, optional `goalData` v1 stub
- [x] **Y1.3** `package.json` — `seed:bb-house`
- [x] **Y1.4** Optional `BB_HOUSE_MEMBER_EMAILS` → `InstanceMembership`
- [x] **Y1.5** BACKLOG row **Y** links to this spec; cross-link `bruised-banana-house-integration/ANALYSIS.md`

## Phase 2 — Recurring quests + house state

- [x] **Y2.1** Recurring quest **stubs** — `data/bruised_banana_house_recurring_quests.json` + `seed-bruised-banana-house-quests.ts` + `npm run seed:bb-house-quests`
- [x] **Y2.2** House state — `bruised-banana-house-state.ts` + `upsertInstance` merge + `InstanceEditModal` house panel

## Phase 3 — Player-facing (defer)

- [ ] **Y3.1** Wiki or dashboard card: “House coordination” → `/campaign/board?ref=bruised-banana-house` (when board supports ref)

## Verification

- [ ] Run `npm run seed:bb-house` against local DB; confirm instance row + memberships (if env set)
