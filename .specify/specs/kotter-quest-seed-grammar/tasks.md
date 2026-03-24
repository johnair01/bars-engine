# Tasks: Kotter Quest Seed Grammar

## Completed (v0)

- [x] `src/lib/kotter-quest-seed-grammar.ts` — 8-stage micro beats + evidence + alchemy + face + trigram essence
- [x] `composeKotterQuestSeedBar` + `fillKotterQuestSeedSlots`
- [x] Deck wizard: `buildRaiseUrgencyQuestPayload` → composer + merge `completionEffects`
- [x] Admin apply: write `emotionalAlchemyTag` / `gameMasterFace` on `CustomBar`
- [x] `src/lib/__tests__/kotter-quest-seed-grammar.test.ts`
- [x] `npm run test:kotter-quest-seed-grammar` in package.json
- [x] Spec kit: `spec.md`, `plan.md`, `tasks.md`

## Completed (spec v1 — design)

- [x] Spec addendum: six-face headline critique + copy direction ([spec.md](./spec.md) §A)
- [x] Dual-face semantics (structural vs reading) documented
- [x] Stage-specific metabolism table (illegal verbs at wrong stage)
- [x] **48-move** GM face × Kotter stage matrix (8 stages × 6 faces) with completion evidence
- [x] Milestone gating model: `kotterStage` / unlock + `getAvailableFaceMoves` contract

## Pending (implementation)

- [ ] `GmFaceStageMove` registry in `src/lib/` (types + data, tests for ids unique and stage/face coverage)
- [ ] `composeKotterQuestSeedBar` + slots: optional `gmFaceMoveId`; `completionEffects.moveId`
- [ ] `getAvailableFaceMoves` — filter by `Instance.kotterStage` and/or milestone completion
- [ ] Milestone → advance `kotterStage` (or `unlockedStageMax`) when criteria met
- [ ] UI: move picker (current stage only per spec default)
- [ ] Optional: headline refresh — domain fallback vs move title; reading-face tint at render
- [ ] After code changes: `npm run test:kotter-quest-seed-grammar`, `npm run check`
