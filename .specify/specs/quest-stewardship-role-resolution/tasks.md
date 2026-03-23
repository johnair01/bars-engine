# Tasks: Quest Stewardship + Role Resolution Engine v0 (GB)

## Phase 1: Library

- [x] **GB-1.1** `src/lib/quest-stewardship.ts` — `QuestLifecycleState` type, `StewardResolution`, `QuestRoleResolution` interfaces
- [x] **GB-1.2** `STEWARD_INTENTS` constant (take_quest, join)

## Phase 2: Actions

- [x] **GB-2.1** `src/actions/quest-stewardship.ts` — `takeQuest(questId)`: upsert BarResponse + PlayerQuest
- [x] **GB-2.2** `releaseQuest(questId)`: update BarResponse intent + PlayerQuest status
- [x] **GB-2.3** `resolveQuestStewards(questId)`: confirmed + candidate stewards
- [x] **GB-2.4** `resolveQuestState(questId)`: proposed | active | completed
- [x] **GB-2.5** `getQuestRoleResolution(questId)`: combined state + stewards + BarRoles

## Verification

- [x] `npx tsc --noEmit` passes on new files
- [x] `npx eslint` passes on new files
