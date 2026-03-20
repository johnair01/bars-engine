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
| `src/lib/agent-mind/types.ts` | AgentMindState, inputs |
| `src/lib/agent-mind/validation.ts` | Nation + archetype resolution |
| `src/lib/agent-mind/createAgent.ts` | createAgent |
| `src/lib/agent-mind/actions.ts` | updateAgentNarrative, selectAgentAction, integrateAgentResult |
| `src/lib/agent-mind/narrativeTriggers.ts` | generateNarrativeLock |
| `src/lib/agent-mind/simulationBridge.ts` | simulateQuestForAgent → FN |
| `src/lib/agent-mind/index.ts` | Public exports |
| `src/lib/agent-mind/__tests__/agentMind.test.ts` | Tests |
| `package.json` | `test:agent-mind` |

## Dependencies

- transformation-move-registry (indirect via simulateQuest)
- archetype-influence-overlay / narrative-transformation (archetype resolution)
- game/nations

## Changelog

| Date | Change |
|------|--------|
| 2026-03-20 | **v0 library** under `src/lib/agent-mind/`; bridge to `simulateQuest`. |
