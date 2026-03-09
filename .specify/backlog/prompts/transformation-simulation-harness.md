# Prompt: Transformation Simulation Harness v0

**Use this prompt when implementing the Transformation Simulation Harness.**

## Context

Bars-engine needs a lightweight simulation environment for testing the transformation engine without UI or human player. The harness simulates quests, agents, campaigns, and onboarding flows using existing systems (transformation-move-registry, encounter-geometry, archetype-overlay, flow-simulator).

## Prompt text

> Implement the Transformation Simulation Harness spec per [.specify/specs/transformation-simulation-harness/spec.md](../specs/transformation-simulation-harness/spec.md). Add CLI subcommands: `bars simulate quest`, `bars simulate agent`, `bars simulate campaign`, `bars simulate onboarding`. Full pipeline: narrative → lock → geometry → quest template → moves → nation/archetype overlay → quest seed → agent action → BAR. Simulation config and result schemas; structured logs in simulation-logs/. Deterministic when seeded.

## Checklist

- [ ] Phase 1: Quest simulation (simulateQuest, full pipeline, --narrative, --json)
- [ ] Phase 2: Agent simulation (agent subcommand, Minimal Agent Mind Model integration)
- [ ] Phase 3: Campaign simulation (multi-agent, --agents, --steps)
- [ ] Phase 4: Onboarding simulation (validate bruised-banana flow)
- [ ] Phase 5: Logging (simulation-logs/, structured JSON)
- [ ] npm run build and npm run check

## Reference

- Spec: [.specify/specs/transformation-simulation-harness/spec.md](../specs/transformation-simulation-harness/spec.md)
- Plan: [.specify/specs/transformation-simulation-harness/plan.md](../specs/transformation-simulation-harness/plan.md)
- Tasks: [.specify/specs/transformation-simulation-harness/tasks.md](../specs/transformation-simulation-harness/tasks.md)
