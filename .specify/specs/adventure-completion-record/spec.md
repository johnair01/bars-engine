# Spec: Adventure Completion Record (Deferred)

## Purpose

Add an explicit record when a player completes an adventure (collection of quests). Currently, thread completion awards vibeulons and sets `ThreadProgress.completedAt`, but there is no first-class "adventure completed" record. Players may want to see "I completed this adventure" for badges, history, or UI.

## Context

- **QuestThread** = collection of quests. Completion → vibeulons + `ThreadProgress.completedAt`.
- **Adventure** = CYOA structure (passages). Linked to QuestThread via `QuestThread.adventureId`.
- When a thread with `adventureId` completes, that effectively means the adventure's quests are done—but there is no explicit AdventureCompletion model.

## Deferred

Not needed now. Add to backlog in case it emerges as a blocker (e.g. UI needs "adventures I've completed", badges, or campaign progress display).

## Possible Implementation (when needed)

- **Option A**: `AdventureCompletion` model (playerId, adventureId, completedAt). Populate when `advanceThreadForPlayer` completes a thread that has `adventureId`.
- **Option B**: Query convention—treat "ThreadProgress.completedAt where thread.adventureId = X" as adventure completed. No schema change; add helper `hasCompletedAdventure(playerId, adventureId)`.

## Reference

- Quest Completion Context: [quest-completion-context-restriction](quest-completion-context-restriction/spec.md)
- Thread advancement: [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts) — `advanceThreadForPlayer`
