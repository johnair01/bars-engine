# Tasks: Random Unpacking Canonical Kernel

## Phase 1 — Canonical Kernel

- [x] Create canonical-kernel.ts with ELEMENT_CHANNEL_STATES
- [x] Add getLabelsForMove(move) — transcend/translate logic, return 2 labels each
- [x] Add ELEMENT_TO_DOMAINS and WAVE_TO_DOMAIN
- [x] Add pickExperienceForPlayer(nationElement?, playbookWave?)

## Phase 2 — Random Unpacking Refactor

- [x] Add playerContext param to generateRandomUnpacking
- [x] Pick random move from ALL_CANONICAL_MOVES
- [x] Derive q2, q4 via getLabelsForMove
- [x] Set alignedAction = move.name, return moveType = move.primaryWaveStage
- [x] Q1: use pickExperienceForPlayer when context; else random
- [x] Q6: keep SHADOW_VOICE_OPTIONS (pickN, 2)

## Phase 3 — Integration

- [x] generateGrammaticQuestFromReading: include nation in player fetch
- [x] Pass nationElement, playbookPrimaryWave to generateRandomUnpacking
- [x] Pass moveType to compileQuestWithAI
- [x] Run npm run build and npm run check — fail-fix
