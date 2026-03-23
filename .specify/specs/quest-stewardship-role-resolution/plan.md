# Plan: Quest Stewardship + Role Resolution Engine v0 (GB)

## Schema changes: none
All resolution is derived from `BarResponse` (GA) + `PlayerQuest` records.

## Phase 1 — Library
- `src/lib/quest-stewardship.ts`: types (`QuestLifecycleState`, `StewardResolution`, `QuestRoleResolution`), pure resolution helpers

## Phase 2 — Actions
- `src/actions/quest-stewardship.ts`: `takeQuest`, `releaseQuest`, `resolveQuestStewards`, `resolveQuestState`, `getQuestRoleResolution`

## File impacts
| File | Change |
|------|--------|
| `src/lib/quest-stewardship.ts` | New — types + helpers |
| `src/actions/quest-stewardship.ts` | New — 5 server actions |
