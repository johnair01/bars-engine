# Tasks: Quest Lineage & Shadow Alignment (QLA)

> Implement per [spec.md](./spec.md) + [plan.md](./plan.md). API-first, in phase order. Each phase
> ends with `npm run build` + `npm run check` (fail-fix). Check items off as completed.

## Phase 1 — Foundation: unify inventory + stop losing lineage (no schema change)

- [x] **T1.1** Extract `src/lib/quests/mint.ts` → `mintQuestFromText(input)`: create
  `CustomBar{type:'quest'}` carrying `lensId/lensGoalId/plantSnapshot`, self-root, create
  `PlayerQuest{status:'assigned'}`, link `sourceTaskId.questId` — all in one transaction. **Done.**
  (Unit test deferred to CI — sandbox can't generate the Prisma client.)
- [x] **T1.2** Fix `growQuestFromBar` (`src/actions/bars.ts`): select the source BAR's
  `lensId/lensGoalId/plantSnapshot` and mint through `mintQuestFromText` so the quest keeps its
  lineage (was hardcoded null). **Done.**
- [x] **T1.3** New `src/actions/vault.ts` → `getVaultInventory()`: owned-active `CustomBar` query
  (bars + charge_capture + **quests**) → `VaultItemDTO[]` + `total` + `hasMore`. **Additive** — the
  five move-room loaders in `vault-queries.ts` are untouched. **Done.** (Cursor paging deferred; a
  `HARD_CAP` with non-silent `hasMore` guards payload size.)
- [x] **T1.4** New canonical **"All BARs"** room `src/app/vault/all/page.tsx` rendering from
  `getVaultInventory` (owned bars + quests, quest badge) and preserving received/sent talismans;
  "All BARs →" entry added to the Vault lobby. Five move-rooms preserved. **Done.**
- [x] **T1.5** `/bars` now `redirect('/vault/all')`; `/bars/[id]` + sub-routes (`/bars/capture`,
  `/bars/feed`, …) retained; received + sent talisman sections carried into the new room so nothing
  is lost. **Done.**
- [ ] **T1.6** `npm run build` && `npm run check` — **must run in CI** (sandbox can't generate the
  Prisma client / download the engine). ESLint clean on all touched files. Then open **Phase 1 PR**.

## Phase 2 — Tasks born as quests + weekly attachment + quest detail

- [x] **T2.1 (Prisma)** `prisma/schema.prisma`: added `CustomBar.shadowAcknowledgedAt DateTime?` +
  `@@index([creatorId, type, status])` + `@@index([lensGoalId])`. **Done.**
- [x] **T2.2 (Prisma)** Migration **hand-authored DB-free** (engine download blocked in sandbox):
  `prisma/migrations/20260701170000_add_quest_shadow_alignment/migration.sql` (additive — one
  nullable column + two indexes, Prisma naming). **CI/local must run `prisma generate` +
  `migrate deploy` + `db:record-schema-hash`.** No Phase-2 code references the new column yet, so
  the build won't depend on a regenerated client.
- [x] **T2.3** `commitTask` now mints a **quest** via `mintQuestFromText` (carrying lineage +
  `questSource:'tap_the_vein'`), links `task.questId`, deals it into the Hand (Vault on overflow),
  returns `{ task, questId, aligned, placedIn, overflow }`. `aligned = goal.cadence==='week'`.
  Compost sync generalized to `task.questId ?? task.barId`. **Done.**
- [x] **T2.4** `upgradeTaskToQuest` short-circuits when `task.questId` exists (idempotent, no
  double-mint). **Done.**
- [x] **T2.5** `CommitPhase` selector filtered to **weekly** goals (default = first weekly);
  empty = "commit as a shadow quest"; no-weekly hint links to `/lenses`; commit note shows
  aligned/shadow. **Done.** (Full inline "descend a weekly goal" deferred — links to Lenses for now.)
- [x] **T2.6** `getQuestLineage(questId)` in `src/actions/quests.ts` (via `resolveLensGoalTrace`).
  **Done.**
- [x] **T2.7** `getBarDetail` allows owner `type='quest'`; `/bars/[id]` renders `QuestLineagePanel`
  (week→year chain + aligned/shadow badge). **Done.** (Interactive fold-in is Phase 3.)
- [ ] **T2.8** `npm run build` && `npm run check` — **must run in CI** (sandbox blocks Prisma
  engine). ESLint clean on all touched files.

**Deferred to Phase 3 (documented, not silently dropped):**
- Task action sheet still offers **keep/plant** which mint a *separate* BAR even though the task is
  already a quest — rationalize the sheet (a born-as-quest task shouldn't re-mint a bar).
- Vault **Show Up/Quests** room (`unplacedPersonalQuestWhere`) filters on `sourceBarId`, so
  born-as-quests (sourceBarId null) show only in `/vault/all`, not that room. `questSource` marker
  is set for a future filter update.

## Phase 3 — Shadow surfacing, fold-in, rollup, verification

- [x] **T3.1** `src/actions/quests.ts`: `listShadowQuests` (derives shadow reason), `foldQuestIntoGoal`
  (attach weekly goal + snapshot, clear `shadowAcknowledgedAt`), `acknowledgeShadowQuest`
  (set it), plus `listActiveWeeklyGoals` (fold-in targets). Ownership-scoped. **Done.** (Unit tests
  deferred to CI — sandbox can't generate the Prisma client.)
- [x] **T3.2** `/vault/shadow` room lists shadow quests (reason chip) with the `ShadowQuestActions`
  client island (fold-in select + "keep as shadow"); the same actions render on `/bars/[id]` for a
  shadow quest; lobby gains a "Shadow quests →" entry. **Done.**
- [x] **T3.3** `getGoalRollup()` read-model: `groupBy` direct quest counts + bounded cycle-guarded
  DFS roll-up over `parentGoalId`. Rendered as a compact "Rolling up" section on `/vault/shadow`
  (display-only). **Done.** (Rendered on the shadow surface, not the heavier Observatory page, to
  keep the change contained.)
- [x] **T3.4 (Verification quest)** `scripts/seed-cert-quest-lineage-alignment.ts` seeds
  `cert-quest-lineage-alignment-v1` (TwineStory + `isSystem` public CustomBar, 5 steps + feedback +
  success), npm script `seed:cert:quest-lineage-alignment`. **Done.** (Seeding itself needs a DB.)
- [ ] **T3.5** Optional non-destructive backfill — **not shipped** (legacy null-lineage quests are
  already valid shadow items surfaced by `listShadowQuests`; a backfill isn't required).
- [ ] **T3.6** `npm run build` && `npm run check`; run `seed:cert:quest-lineage-alignment`; walk the
  cert — **must run in CI / a DB-connected env** (sandbox blocks the Prisma engine). ESLint clean.

## Cross-cutting
- [ ] Every new action scoped to `getCurrentPlayer()`; ownership checked on quest/goal ids.
- [ ] `revalidatePath('/vault' | '/tap-the-vein' | '/observatory')` on mutations.
- [ ] Update `docs/` if the Vault/`/bars` route change affects onboarding docs.
- [ ] Mark **2.11 TTVU** superseded in BACKLOG once Phase 2 lands.
