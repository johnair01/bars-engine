# Tasks: Actor Capability + Quest Eligibility Engine v0 (GC)

## Phase 1: Library

- [x] **GC-1.1** `src/lib/actor-eligibility.ts` — `EligibleQuest`, `EligibleActor` types; scoring constants
- [x] **GC-1.2** `scoreQuestForActor()` pure function
- [x] **GC-1.3** `scoreActorForQuest()` pure function

## Phase 2: Actions

- [x] **GC-2.1** `src/actions/quest-eligibility.ts` — `getEligibleQuestsForActor(playerId, opts?)`
- [x] **GC-2.2** `getRecommendedQuestsForActor(playerId, opts?)` — score ≥ 1, sorted
- [x] **GC-2.3** `getEligibleActorsForQuest(questId)` — players who can respond
- [x] **GC-2.4** `getRecommendedRespondersForQuest(questId)` — score ≥ 1, sorted

## Verification

- [x] `npx tsc --noEmit` passes (no errors on GC files; pre-existing errors unrelated)
- [x] `npx eslint` passes
