# Tasks: Creation Quest Bootstrap

## Phase 1 — API Contracts + Types

- [x] Create `src/lib/creation-quest/types.ts` with CreationIntent, CreationContext, CreationQuestPacket, AssembleInputs, QuestNode
- [x] Create `src/lib/creation-quest/index.ts` with exports
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 2 — Extraction + Generation Stubs

- [x] Create `src/lib/creation-quest/extractCreationIntent.ts` — accept unpacking answers, return CreationIntent with confidence
- [x] Create `src/lib/creation-quest/generateCreationQuest.ts` — accept intent + context, return CreationQuestPacket with heuristicVsAi
- [x] Create `src/lib/creation-quest/assembleArtifact.ts` — deterministic assembly (nodes → Passage-like or Twine)
- [x] Wire extractCreationIntent → generateCreationQuest → assembleArtifact
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 3 — Bootstrap Pipeline

- [x] Create `scripts/bootstrap-creation-quests.ts` (or admin tool) — AI generates examples → store
- [x] Add analysis step — identify patterns from stored examples
- [x] Add heuristic derivation — encode rules into extractCreationIntent and generateCreationQuest
- [x] Optional: unit tests for extraction and generation

## Phase 4 — Rules-First Runtime

- [x] Add `CREATION_QUEST_HEURISTIC_THRESHOLD` env (default 0.8)
- [x] Implement threshold logic: use rules when confidence >= threshold
- [x] Implement AI fallback when no template matches or confidence < threshold
- [x] Log heuristicVsAi and templateMatched in result
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 5 — Observability + Control Plane

- [x] Log intentConfidence, heuristicVsAi, templateMatched after each generation
- [x] Add `CREATION_QUEST_AI_ENABLED` feature flag
- [x] When AI disabled: rules-only; graceful degradation when no heuristic matches
- [x] Run `npm run build` and `npm run check` — fail-fix
