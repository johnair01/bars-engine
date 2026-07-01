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

- [ ] **T2.1 (Prisma)** Edit `prisma/schema.prisma`: add `CustomBar.shadowAcknowledgedAt DateTime?`;
  add `@@index([creatorId, type, status])` and `@@index([lensGoalId])` if absent.
- [ ] **T2.2 (Prisma)** `npx prisma migrate dev --name add_quest_shadow_alignment`; **commit**
  `prisma/migrations/<ts>_add_quest_shadow_alignment/migration.sql` with `schema.prisma`; then
  `npm run db:sync` (regen client) and `npm run db:record-schema-hash`. Human-glance the SQL
  (additive only). See [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md).
- [ ] **T2.3** `commitTask` (`src/actions/tap-the-vein.ts`): mint a **quest** via `mintQuestFromText`
  (drop the bare-`type='bar'` path); accept `weeklyLensGoalId`; return
  `{ task, questId, aligned, placedIn }`; set `task.questId`. Preserve Hand/Vault placement of the
  quest (reuse `addBarToHandForPlayer`). Update the return-shape consumers.
- [ ] **T2.4** `upgradeTaskToQuest` → idempotent no-op/redirect returning the existing `questId`
  (back-compat; never double-mint).
- [ ] **T2.5** TTV Commit UI (`TapTheVeinRunner.tsx` `CommitPhase`): require/encourage an **active
  weekly goal**; when none for the chosen domain, inline "descend a weekly goal" (reuse lenses
  descent action); thread `weeklyLensGoalId`; note aligned target + Hand/Vault placement.
- [ ] **T2.6** `getQuestLineage(questId)` in `src/actions/quests.ts` (reuse `buildLensGoalSnapshot`).
- [ ] **T2.7** `/bars/[id]` (`getBarDetail` + page): allow `type='quest'`; render lineage chain
  (week→year), alignment badge, and fold-in entry when shadow.
- [ ] **T2.8** `npm run build` && `npm run check`. Open **Phase 2 PR**.

## Phase 3 — Shadow surfacing, fold-in, rollup, verification

- [ ] **T3.1** `src/actions/quests.ts`: `listShadowQuests`, `foldQuestIntoGoal({questId,
  weeklyLensGoalId})` (attach + clear `shadowAcknowledgedAt`), `acknowledgeShadowQuest(questId)`
  (set `shadowAcknowledgedAt`). Ownership-scoped; tests.
- [ ] **T3.2** Vault **Shadow** room UI + a Quests surface (aligned vs shadow) with fold-in /
  acknowledge actions. Wire `LensGoal.alignmentType` display.
- [ ] **T3.3** `getGoalRollup(playerId)` read-model: aggregate child quest/goal progress up
  `parentGoalId` (bounded ≤4 hops, batched). Render in `src/app/observatory/**` (+ lenses),
  display-only (no auto-complete).
- [ ] **T3.4 (Verification quest)** Seed `cert-quest-lineage-alignment-v1`: Twine passages (spec
  steps 1–5), `scripts/seed-cert-quest-lineage-alignment.ts` (idempotent, `isSystem:true`,
  `visibility:'public'`), npm script `seed:cert:quest-lineage-alignment`. Reference
  [cyoa-certification-quests](../cyoa-certification-quests/) + `scripts/seed-cyoa-certification-quests.ts`.
- [ ] **T3.5** Optional idempotent backfill script: mark legacy null-lineage quests as shadow /
  match obvious weekly goals (non-destructive; not required to ship).
- [ ] **T3.6** `npm run build` && `npm run check`; run `seed:cert:quest-lineage-alignment`; walk the
  cert. Open **Phase 3 PR**.

## Cross-cutting
- [ ] Every new action scoped to `getCurrentPlayer()`; ownership checked on quest/goal ids.
- [ ] `revalidatePath('/vault' | '/tap-the-vein' | '/observatory')` on mutations.
- [ ] Update `docs/` if the Vault/`/bars` route change affects onboarding docs.
- [ ] Mark **2.11 TTVU** superseded in BACKLOG once Phase 2 lands.
