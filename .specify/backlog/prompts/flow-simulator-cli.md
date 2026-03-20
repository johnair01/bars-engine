# Prompt: Flow Simulator CLI + Bounded Simulated Actor Roles

**Use this prompt when implementing the Flow Simulator CLI and bounded simulated actor roles.**

## Context

Bars-engine needs a lightweight simulation environment for quest flows and onboarding flows. The CLI should validate fixtures, support onboarding debugging, and enable quest execution testing outside the UI. Bounded simulated actors (Librarian, Collaborator, Witness) provide groundwork for future single-player mode with simulated collaborators.

## Prompt text

> Implement the Flow Simulator CLI spec per [.specify/specs/flow-simulator-cli/spec.md](../specs/flow-simulator-cli/spec.md). Add simulateFlow(flow, context); CLI with bars simulate (or npm run simulate); Bruised Banana fixtures (campaign_intro, identity_selection, intended_impact_bar); bounded actor role scaffold (getSimulatedActorRole). Deterministic flow simulation; no Level 3 world simulation.

## Checklist

- [x] Phase 1: Flow simulator core (simulateFlow, CLI, flags)
- [x] Phase 2: Bruised Banana fixtures (3 JSON files, all pass)
- [x] Phase 3: Bounded actor scaffold (roles, getSimulatedActorRole)
- [x] Phase 4: Tests (fixtures pass, failure cases, actor constraints)
- [x] Run `npm run test:simulation`; use `npm run check` when changing app code

## Reference

- Spec: [.specify/specs/flow-simulator-cli/spec.md](../specs/flow-simulator-cli/spec.md)
- Plan: [.specify/specs/flow-simulator-cli/plan.md](../specs/flow-simulator-cli/plan.md)
- Tasks: [.specify/specs/flow-simulator-cli/tasks.md](../specs/flow-simulator-cli/tasks.md)
- Docs: [docs/architecture/flow-simulator-cli.md](../../docs/architecture/flow-simulator-cli.md), [docs/architecture/simulated-actor-roles.md](../../docs/architecture/simulated-actor-roles.md)
