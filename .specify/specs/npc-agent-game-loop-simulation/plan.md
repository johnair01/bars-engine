# Plan: NPC Agent Game Loop Simulation

## Summary

API-first implementation: pickQuestForAgent and simulateAgentGameLoop. Reuse completeQuestForPlayer. No schema change for v1; agents use existing Player records.

## Phases

### Phase 1: pickQuestForAgent
- Get threads with progress for playerId; find current quest (assigned, not completed)
- Or: get market quests; filter by instance/kotterStage; return first available
- Assign quest to player if needed (create PlayerQuest)
- Return questId, threadId, inputs (empty for simple quests)

### Phase 2: simulateAgentGameLoop
- Loop N times (default 5)
- Each iteration: pickQuestForAgent → completeQuestForPlayer
- Track completed, failed, vibeulons earned
- Return SimulationReport

### Phase 3: Agent player creation (Deferred)
- Seed or admin action to create agent players
- Optional: creatorType or isAgent on Player schema
