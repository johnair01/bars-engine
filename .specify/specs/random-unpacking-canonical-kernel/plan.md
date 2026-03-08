# Plan: Random Unpacking Canonical Kernel

## Summary

Create a canonical kernel of satisfaction/dissatisfaction mappings from emotional alchemy moves; refactor random unpacking to use it, randomize the move and self-sabotage, and derive experience from nation and playbook.

## Phase 1: Canonical Kernel

- Create `src/lib/quest-grammar/canonical-kernel.ts`
- Add ELEMENT_CHANNEL_STATES (element → dissatisfiedLabels, satisfiedLabels) from emotional-alchemy-interfaces.md §5
- Add getLabelsForMove(move): for transcend use element; for translate use fromElement→dissatisfied, toElement→satisfied; return 2 labels each
- Add ELEMENT_TO_DOMAINS and WAVE_TO_DOMAIN from emotional-alchemy-interfaces.md §4
- Add pickExperienceForPlayer(nationElement?, playbookWave?): intersect domains when both present; fallback to random

## Phase 2: Random Unpacking Refactor

- Update `generateRandomUnpacking(playerContext?)` in random-unpacking.ts
- Pick random move from ALL_CANONICAL_MOVES
- Derive q2, q4 via getLabelsForMove(move)
- Set alignedAction = move.name
- Return moveType = move.primaryWaveStage
- Q6: keep pickN(SHADOW_VOICE_OPTIONS, 2)
- Q1: pickExperienceForPlayer when context; else random

## Phase 3: Integration

- generateGrammaticQuestFromReading: extend player fetch with nation; get playbookPrimaryWave
- Pass { nationElement, playbookPrimaryWave } to generateRandomUnpacking
- Pass moveType to compileQuestWithAI

## File Impacts

| Action | Path |
|--------|------|
| Create | src/lib/quest-grammar/canonical-kernel.ts |
| Modify | src/lib/quest-grammar/random-unpacking.ts |
| Modify | src/actions/generate-quest.ts |
| Modify | src/lib/quest-grammar/index.ts (export if needed) |
