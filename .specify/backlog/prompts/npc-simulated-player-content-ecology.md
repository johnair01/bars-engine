# Prompt: NPC & Simulated Player Content Ecology

**Use this prompt when implementing the NPC and simulated player content ecology.**

## Context

Bars-engine needs NPCs and simulated players to:
1. **Test before real players** — Simulate diverse user types and journeys to validate flows and find friction
2. **Single-player mode** — Players who want to play alone can experience the game with simulated collaborators and a populated world
3. **Content generation** — NPCs as agents propose BARs and quests via existing pipelines

**GM Analysis**: See [.specify/specs/npc-simulated-player-content-ecology/GM_ANALYSIS.md](../specs/npc-simulated-player-content-ecology/GM_ANALYSIS.md) for six-face perspective. Key principles: single-player companionship first; reuse over reinvention; schema markers for agent-created records; agents propose, humans approve; transparent labeling.

## Implementation Order

1. **Phase 1**: Single-player companionship — proposeActorAction, getActorGuidance, UI labeling
2. **Phase 2**: Simulated player cohort — creatorType/isAgent on Player, seed script, simulateAgentGameLoop
3. **Phase 3**: NPC content proposal — agent-facing pipeline, admin gate, provenance

## Spec Kit

- Spec: [.specify/specs/npc-simulated-player-content-ecology/spec.md](../specs/npc-simulated-player-content-ecology/spec.md)
- Plan: [.specify/specs/npc-simulated-player-content-ecology/plan.md](../specs/npc-simulated-player-content-ecology/plan.md)
- Tasks: [.specify/specs/npc-simulated-player-content-ecology/tasks.md](../specs/npc-simulated-player-content-ecology/tasks.md)
- GM Analysis: [.specify/specs/npc-simulated-player-content-ecology/GM_ANALYSIS.md](../specs/npc-simulated-player-content-ecology/GM_ANALYSIS.md)

## Dependencies

- npc-agent-game-loop-simulation (pickQuestForAgent, simulateAgentGameLoop)
- flow-simulator-cli (simulateFlow, bounded actor roles)
- simulated-collaborators (proposeActorAction, getActorGuidance)
- minimal-agent-mind-model (agent state, persona variables)
- Singleplayer Charge Metabolism (single-player substrate)
