# Spec Kit Prompt: Archetype Agent Ecology v0

## Role

You are a Spec Kit agent responsible for implementing the Archetype Agent Ecology subsystem.

## Objective

Implement archetype-based AI agents that participate in Bars-engine as structured ecological actors. Agents express archetypal motion patterns (initiate, explore, reveal, stabilize, etc.) and emit bounded actions. Rule-based v0; API-first.

## Prompt (API-First)

> Implement Archetype Agent Ecology per [.specify/specs/archetype-agent-ecology/spec.md](../specs/archetype-agent-ecology/spec.md). **API-first**: define service/action signatures and data shapes before UI. Spec: [archetype-agent-ecology](../specs/archetype-agent-ecology/spec.md). API contracts: [docs/architecture/archetype-agent-api.md](../../docs/architecture/archetype-agent-api.md).

## Requirements

- **Surfaces**: Admin agent list, evaluation triggers (cron/webhook), dashboard agent actions feed (future)
- **Mechanics**: Rule-based action generation; signal observation (BAR, quest, campaign); throttling
- **Persistence**: Optional AgentActor/AgentAction tables; in-memory config for v0
- **API**: listAgents, getAgent, listAgentActions, pauseAgent, resumeAgent, runArchetypeAgentEvaluation, evaluateAgentsForBar, evaluateAgentsForCampaign, evaluateAgentsForQuest
- **Verification**: Rule engine tests; evaluation tests; private data not leaked

## Checklist (API-First Order)

- [ ] API contract (input/output) defined in spec or plan
- [ ] Types and archetype motion model implemented
- [ ] Rule engine and signals implemented
- [ ] Server Actions implemented
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] .specify/specs/archetype-agent-ecology/spec.md (done)
- [ ] .specify/specs/archetype-agent-ecology/plan.md (done)
- [ ] .specify/specs/archetype-agent-ecology/tasks.md (done)
- [ ] src/features/agents/ (or src/lib/agents/) — types, archetypes, services, api
- [ ] Tests for rule engine and evaluation

## References

- [archetype-agent-ecology.md](../../docs/architecture/archetype-agent-ecology.md)
- [archetype-agent-api.md](../../docs/architecture/archetype-agent-api.md)
- [archetype-agent-example.md](../../docs/examples/archetype-agent-example.md)
- [archetype-agent-world-loop-example.md](../../docs/examples/archetype-agent-world-loop-example.md)
