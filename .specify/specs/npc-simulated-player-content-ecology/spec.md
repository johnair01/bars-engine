# Spec: NPC & Simulated Player Content Ecology

## Purpose

Enable NPCs and simulated player personas to create content (quests, BARs, artifacts) and move through the app as agents. This supports:

1. **Testing before real players** — Simulate diverse user types and journeys to validate flows, find friction, and stress-test systems.
2. **Single-player mode** — Players who want to play alone can experience the game with simulated collaborators, NPCs, and a populated world.
3. **Content generation at scale** — NPCs as agents produce BARs, quest seeds, and narrative artifacts that enrich the ecosystem.

**Practice**: Deftness Development — API-first, bounded scope, deterministic fallbacks, reuse over reinvention.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Scope | Build on existing: npc-agent-game-loop-simulation, flow-simulator-cli, minimal-agent-mind-model |
| Content creation | NPCs propose BARs/quests via existing pipelines; admin or player approves before publication |
| User personas | Typed user profiles (nation, archetype, goal, friction profile) drive simulation behavior |
| Single-player | Simulated collaborators (Librarian, Collaborator, Witness) animate flows; player remains primary actor |
| Risk mitigation | Bounded agents; no autonomous world mutation; clear separation of simulation vs production data |

## Conceptual Model

| Concept | Meaning |
|--------|---------|
| **Simulated player** | A Player record with `creatorType: 'agent'` or similar; runs game loop (pick quest → complete) via `simulateAgentGameLoop` |
| **User persona** | Typed profile (nation, archetype, goal, friction profile) used to parameterize simulation runs |
| **NPC content creator** | Agent that proposes BARs, quest seeds, or narrative artifacts via existing Admin Agent Forge / BAR→Quest pipelines |
| **Simulated collaborator** | Bounded actor (Librarian, Collaborator, Witness) that proposes, suggests, acknowledges in flows — does not finalize |
| **Single-player mode** | Player plays alone; simulated collaborators provide guidance, witness, and companionship in flows |

## User Stories

### Testing & Simulation

**US-T1**: As a developer, I can run a simulation with N typed user personas (e.g. "Argyra Bold Heart", "Pyrakanth Truth Seer") moving through onboarding and quest flows, so that I can validate behavior and find friction before real players arrive.

**US-T2**: As an admin, I can seed a cohort of simulated players with varied nations/archetypes and run `simulateAgentGameLoop` for each, so that the market and threads show realistic activity for single-player testing.

### Single-Player Mode

**US-S1**: As a player who wants to play alone, I can enable single-player mode and receive guidance from simulated collaborators (Librarian, Collaborator, Witness) in flows, so that I feel accompanied without requiring other humans.

**US-S2**: As a single-player, I experience a world populated by NPC-generated content (BARs, quests) that I can discover and engage with, so that the game feels alive even when I am the only human.

### Content Creation

**US-C1**: As an admin, I can configure NPC content creators with persona profiles (nation, archetype, goal) and have them propose BARs or quest seeds via the existing forge/transformation pipeline, so that content is generated at scale with minimal manual authoring.

**US-C2**: As a player in single-player mode, I encounter BARs and quests that appear to come from NPCs with distinct voices, so that the world feels inhabited by characters rather than templates.

## Dependencies

- [npc-agent-game-loop-simulation](.specify/specs/npc-agent-game-loop-simulation/spec.md) — pickQuestForAgent, simulateAgentGameLoop (implemented)
- [flow-simulator-cli](.specify/specs/flow-simulator-cli/spec.md) — simulateFlow, bounded actor roles
- [minimal-agent-mind-model](.specify/specs/minimal-agent-mind-model/spec.md) — agent state, decision loop
- [simulated-collaborators](.specify/specs/simulated-collaborators/plan.md) — proposeActorAction, actor guidance
- [Admin Agent Forge](.specify/specs/admin-agent-forge/spec.md) — NPC content proposal pipeline
- [Singleplayer Charge Metabolism](.specify/specs/singleplayer-charge-metabolism/spec.md) — single-player substrate

## Out of Scope (v1)

- Full autonomous NPC society
- Freeform world simulation
- NPCs that mutate production data without approval
- Real-time multiplayer simulation
