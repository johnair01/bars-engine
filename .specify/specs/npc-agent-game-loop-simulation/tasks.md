# Tasks: NPC Agent Game Loop Simulation

## Phase 1: pickQuestForAgent

- [x] Create src/actions/agent-game-loop.ts
- [x] Implement pickQuestForAgent(playerId, options?)
- [x] Source: already-assigned quest, or market quests (pick up)
- [x] Assign quest to player if not already assigned

## Phase 2: simulateAgentGameLoop

- [x] Implement simulateAgentGameLoop(playerId, iterations?)
- [x] Loop: pickQuestForAgent → completeQuestForPlayer
- [x] Return SimulationReport with completed, failed, vibeulonsEarned

## Phase 3: Verification

- [ ] Run npm run build and npm run check
- [x] Add test script scripts/test-agent-game-loop.ts
