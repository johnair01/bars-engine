# Tasks: I Ching Grammatic Quests

## Phase 1 — I Ching Context in Quest Grammar

- [x] Add IChingContext interface to types.ts
- [x] Add ichingContext?: IChingContext to QuestCompileInput and BuildQuestPromptContextInput
- [x] buildQuestPromptContext: inject "## I Ching Context" section when ichingContext present
- [x] Extend inputKey in compileQuestWithAI and generateQuestOverviewWithAI to include ichingContext

## Phase 2 — Random Unpacking

- [x] Create generateRandomUnpacking() using unpacking-constants
- [x] Return valid UnpackingAnswers + alignedAction (MOVE_OPTIONS)
- [x] Add short-phrase pools for q3 and q5 if needed

## Phase 3 — I Ching Grammatic Flow

- [x] Refactor generateQuestFromReading to use random unpacking + ichingContext + compileQuestWithAI
- [x] Implement publishIChingQuestToPlayer (Adventure + Passages + assign)
- [x] Complete orientation-quest-3 as today; return adventureId/questTitle for UI
- [x] Update DashboardCaster / QuestDetailModal to redirect or link to adventure play
- [x] Run npm run build and npm run check — fail-fix
