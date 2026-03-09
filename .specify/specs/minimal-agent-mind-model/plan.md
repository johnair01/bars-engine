# Plan: Minimal Agent Mind Model v0

## Summary

Implement minimal agent state and decision logic for simulated agents. Six core variables; simple heuristics; integration with transformation pipeline.

## Phases

### Phase 1: Agent state and creation

- Define `AgentMindState` type (agent_id, nation, archetype, goal, narrative_lock, emotional_state, energy, bars).
- Implement `createAgent(config)`.
- Validate nation and archetype against canonical lists.

### Phase 2: Narrative and action

- Implement `updateAgentNarrative(agent, newLock)`.
- Implement `selectAgentAction(agent, questSeed)` — heuristic based on archetype, energy, quest stage.
- Implement `integrateAgentResult(agent, result, barCreated)`.

### Phase 3: Narrative generation triggers

- Define triggers: goal conflict, low energy, failed experiment, social interaction.
- Implement `generateNarrativeLock(agent, trigger)` — simple template-based or heuristic generation.

### Phase 4: Integration and tests

- Wire to Transformation Simulation Harness agent mode.
- Tests: narrative locks, quest generation, state updates, BAR creation, evolution over runs.

## File Impacts

| File | Action |
|------|--------|
| `src/lib/simulation/agentMind.ts` | New — AgentMindState, createAgent, updateAgentNarrative, selectAgentAction, integrateAgentResult |
| `src/lib/simulation/agentNarrative.ts` | New — generateNarrativeLock, triggers |
| `src/lib/simulation/types.ts` | Extend — AgentMindState |
| `src/lib/simulation/__tests__/agentMind.test.ts` | New — tests |

## Dependencies

- transformation-move-registry
- archetype-influence-overlay
- canonical-archetypes
- game/nations
