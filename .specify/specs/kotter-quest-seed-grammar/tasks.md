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

- [x] Addendum E: player encounter, nested campaigns, Sage v1 inheritance (frozen pre–Phase B); WMC cross-link
- [x] Spec addendum: six-face headline critique + copy direction ([spec.md](./spec.md) §A)
- [x] Dual-face semantics (structural vs reading) documented
- [x] Stage-specific metabolism table (illegal verbs at wrong stage)
- [x] **48-move** GM face × Kotter stage matrix (8 stages × 6 faces) with completion evidence
- [x] Milestone gating model: `kotterStage` / unlock + `getAvailableFaceMoves` contract

## Pending (implementation)

- [x] `GmFaceStageMove` registry — [`src/lib/gm-face-stage-moves.ts`](../../../src/lib/gm-face-stage-moves.ts) (48 moves, load-time `assertGmFaceStageMoveRegistry`)
- [x] `composeKotterQuestSeedBar` + `fillKotterQuestSeedSlots`: optional `gmFaceMoveId`; `completionEffects.moveId`; `slots.faceMove`; title + micro-beat + evidence from move when resolved
- [x] `getAvailableFaceMovesForStage` + `getGmFaceMoveAvailabilityForCampaign` — strict lockstep on `Instance.kotterStage`
- [x] Milestone: when `targetValue` met via `recordContribution`, mark complete + bump `kotterStage` (cap 8); `adminCompleteCampaignMilestone` for manual close
- [x] UI: campaign hub `GmFaceMovesPanel` (six moves for current stage)
- [x] Regression: `npm run test:kotter-quest-seed-grammar` + `npm run test:gm-face-moves-availability` (run in CI / before ship)

## Next (KQSG — pick a slice)

- [x] **Phase C:** stage-1 play headlines + optional `readingFace` tint + `completionEffects.readingFace` ([`kotter-quest-seed-grammar.ts`](../../../src/lib/kotter-quest-seed-grammar.ts))
- [x] **Phase B+ surfaces:** hub + landing + `completeSpokeSession` → `persistGmFaceMoveQuestBar` / `composeKotterQuestSeedBar` with `kotterStage`, `gameMasterFace`, optional alchemy + `readingFace`, optional `gmFaceMoveId` (`src/lib/gm-face-move-quest-persist.ts`, `src/actions/gm-face-move-quest-seed.ts`, `GmFaceMoveQuestPickButton`)
- [x] **Phase B+ surfaces:** quest create (`/quest/create` + `QuestWizard` + `createQuestFromWizard`) and admin deck wizard (`DeckIntakeV1.gmFaceMoveId` + `buildRaiseUrgencyQuestPayload`) → optional `gmFaceMoveId` (Addendum E)
- [ ] **Domain filter (when ready):** narrow or tint available moves by `allyshipDomain` (spec: domain tints everything)
- [ ] **Drift reduction (optional):** align generic `STAGE_MICRO_BEAT` / `STAGE_EVIDENCE` with matrix defaults when no `gmFaceMoveId`
- [ ] **Child campaign §E.1:** schema + flows for `parentCampaignRef`, provenance, resets (WMC/KQSG cross-link — separate epic)
- [ ] **Hexagram names:** use DB/Canon names when available (trigram pair fallback remains)
