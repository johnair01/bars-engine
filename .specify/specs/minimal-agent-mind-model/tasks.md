# Tasks: Minimal Agent Mind Model v0

## Phase 1: Agent state and creation

- [x] Define `AgentMindState` type (`src/lib/agent-mind/types.ts`)
- [x] Implement `createAgent(config)` (`createAgent.ts`)
- [x] Validate nation against canonical list (`NATIONS` / `resolveNationOrThrow`)
- [x] Validate archetype against playbook slugs + signal keys (`resolveArchetypeOrThrow` / `resolvePlaybookArchetypeKey`)

## Phase 2: Narrative and action

- [x] Implement `updateAgentNarrative(agent, newLock)`
- [x] Implement `selectAgentAction(agent, questSeed)` — heuristic by emotional_state, energy, lock text
- [x] Implement `integrateAgentResult(agent, result, barCreated)` — bars array + energy

## Phase 3: Narrative generation triggers

- [x] Define triggers: goal_conflict, low_energy, failed_experiment, social_interaction
- [x] Implement `generateNarrativeLock(agent, trigger)` (`narrativeTriggers.ts`)

## Phase 4: Integration and tests

- [x] Wire to Transformation Simulation Harness — `simulateQuestForAgent` (`simulationBridge.ts`)
- [x] Tests: `npm run test:agent-mind` (locks, quests from agent, state updates)
- [ ] Test: agents evolve over multi-step simulation runs (CLI harness)
- [ ] Test: BAR creation end-to-end with real BAR ids (when wired to DB sandbox)
