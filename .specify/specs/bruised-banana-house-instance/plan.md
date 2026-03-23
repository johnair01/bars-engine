# Plan: Bruised Banana House Instance (Y)

## Phase 1 — Instance + seed (current)

1. Add **spec kit** (`spec.md`, `plan.md`, `tasks.md`).
2. Implement **`seed-bruised-banana-house-instance.ts`** + **`npm run seed:bb-house`**.
3. Register path in [BACKLOG.md](../../backlog/BACKLOG.md) row Y (link to this folder).
4. Operator note: **Do not** set house as `AppConfig.activeInstance` if `/event` should stay on fundraiser; use memberships + `?ref=bruised-banana-house` when board/hub support it.

**Files:** `scripts/seed-bruised-banana-house-instance.ts`, `package.json`

## Phase 2 — Recurring quests + house state (**shipped**)

- **Quest stubs:** `data/bruised_banana_house_recurring_quests.json` + `scripts/seed-bruised-banana-house-quests.ts` + `npm run seed:bb-house-quests` (`campaignRef: bruised-banana-house`, cadence in `docQuestMetadata`).
- **House state:** `src/lib/bruised-banana-house-state.ts` + admin **Edit instance** panel for `bruised-banana-house` (operator note, health 1–5 / clear).
- **Deferred:** cron, auto `recurringLastDone`, player-facing house card (Phase 3).

## Phase 3 — Cross-instance UX (future)

- Milestone / guided actions include house when player is member (see BBMT + ANALYSIS).

## Verification (Phase 1)

```bash
npx tsx scripts/with-env.ts "npx tsx scripts/seed-bruised-banana-house-instance.ts"
# or
npm run seed:bb-house
```

In Prisma Studio or SQL: confirm row `slug = bruised-banana-house`, `campaignRef = bruised-banana-house`, `parentInstanceId` set when BB residency exists.
