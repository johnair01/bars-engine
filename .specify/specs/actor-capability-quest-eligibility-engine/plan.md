# Plan: Actor Capability + Quest Eligibility Engine v0 (GC)

## Schema changes: none

## Phase 1 — Library
- `src/lib/actor-eligibility.ts`: scoring types, `scoreQuestForActor()`, `scoreActorForQuest()`

## Phase 2 — Actions
- `src/actions/quest-eligibility.ts`: 4 query actions

## File impacts
| File | Change |
|------|--------|
| `src/lib/actor-eligibility.ts` | New |
| `src/actions/quest-eligibility.ts` | New |
