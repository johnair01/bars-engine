# Tasks: Minimal Agent Mind Model v0

## Phase 1: Agent state and creation

- [ ] Define `AgentMindState` type
- [ ] Implement `createAgent(config)`
- [ ] Validate nation against canonical list (Argyra, Pyrakanth, Lamenth, Meridia, Virelune)
- [ ] Validate archetype against canonical list (8 archetypes)

## Phase 2: Narrative and action

- [ ] Implement `updateAgentNarrative(agent, newLock)`
- [ ] Implement `selectAgentAction(agent, questSeed)` — heuristic by archetype, energy, quest stage
- [ ] Implement `integrateAgentResult(agent, result, barCreated)`

## Phase 3: Narrative generation triggers

- [ ] Define triggers: goal conflict, low energy, failed experiment, social interaction
- [ ] Implement `generateNarrativeLock(agent, trigger)`

## Phase 4: Integration and tests

- [ ] Wire to Transformation Simulation Harness agent mode
- [ ] Test: agents generate narrative locks
- [ ] Test: quests generated correctly from agent narrative
- [ ] Test: agent actions update state
- [ ] Test: BAR creation works
- [ ] Test: agents evolve over simulation runs
