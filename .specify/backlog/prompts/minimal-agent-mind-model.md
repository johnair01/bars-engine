# Prompt: Minimal Agent Mind Model v0

**Use this prompt when implementing the Minimal Agent Mind Model.**

## Context

Simulated agents need minimal internal state to behave coherently in the Bars-engine transformation system. Agents may represent NPCs, simulated players, testing agents, or story characters. The model should be minimal but sufficient for believable behavior.

## Prompt text

> Implement the Minimal Agent Mind Model spec per [.specify/specs/minimal-agent-mind-model/spec.md](../specs/minimal-agent-mind-model/spec.md). Define AgentMindState (agent_id, nation, archetype, goal, narrative_lock, emotional_state, energy, bars). Implement createAgent, updateAgentNarrative, selectAgentAction, integrateAgentResult. Narrative generation triggers: goal conflict, low energy, failed experiment, social interaction. Integrate with transformation pipeline (same quest request flow as players). Small state, clear heuristics, inspectable behavior.

## Checklist

- [ ] Phase 1: Agent state and creation (AgentMindState, createAgent)
- [ ] Phase 2: Narrative and action (updateAgentNarrative, selectAgentAction, integrateAgentResult)
- [ ] Phase 3: Narrative generation triggers (generateNarrativeLock)
- [ ] Phase 4: Integration and tests (Transformation Simulation Harness agent mode)
- [ ] npm run build and npm run check

## Reference

- Spec: [.specify/specs/minimal-agent-mind-model/spec.md](../specs/minimal-agent-mind-model/spec.md)
- Plan: [.specify/specs/minimal-agent-mind-model/plan.md](../specs/minimal-agent-mind-model/plan.md)
- Tasks: [.specify/specs/minimal-agent-mind-model/tasks.md](../specs/minimal-agent-mind-model/tasks.md)
