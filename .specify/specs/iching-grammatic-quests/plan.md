# Plan: I Ching Grammatic Quests

## Summary

Add IChingContext to Quest Grammar; randomly generate unpacking before I Ching; replace I Ching CustomBar output with QuestPacket → Adventure → assign to player.

## Phase 1: I Ching Context in Quest Grammar

- Add IChingContext to types.ts; extend QuestCompileInput, BuildQuestPromptContextInput
- buildQuestPromptContext: inject I Ching section when ichingContext present
- Extend cache inputKey in compileQuestWithAI, generateQuestOverviewWithAI

## Phase 2: Random Unpacking

- Create generateRandomUnpacking() in src/lib/quest-grammar/random-unpacking.ts or src/actions/iching-quest.ts
- Use EXPERIENCE_OPTIONS, SATISFACTION_OPTIONS, DISSATISFACTION_OPTIONS, SHADOW_VOICE_OPTIONS, LIFE_STATE_OPTIONS, MOVE_OPTIONS from unpacking-constants
- For q3 (short): use template "Life is {lifeState}. {shortPhrase}" with random lifeState and short phrase
- For q5 (short): use template with emotional insight
- Return UnpackingAnswers + alignedAction

## Phase 3: I Ching Grammatic Flow

- Refactor generateQuestFromReading to: generateRandomUnpacking → build ichingContext from hexagram + alignment → compileQuestWithAI → publishIChingQuestToPlayer
- publishIChingQuestToPlayer: create Adventure, Passages, assign to player (Thread or starterPack activeBars)
- UI: on success, redirect to /adventures/[id]/play or show link

## File Impacts

| Action | Path |
|--------|------|
| Modify | src/lib/quest-grammar/types.ts |
| Modify | src/lib/quest-grammar/buildQuestPromptContext.ts |
| Modify | src/actions/quest-grammar.ts |
| Modify | src/actions/generate-quest.ts |
| Create | src/lib/quest-grammar/random-unpacking.ts |
| Create | publishIChingQuestToPlayer in quest-grammar actions |
