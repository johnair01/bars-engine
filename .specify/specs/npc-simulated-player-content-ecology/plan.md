# Plan: NPC & Simulated Player Content Ecology

## Summary

Phased implementation building on existing specs: single-player companionship first (proposeActorAction, actor guidance), then simulated player cohort (schema, seed, game loop), then NPC content proposal (agent-facing pipeline, admin gate). Reuse npc-agent-game-loop-simulation, flow-simulator-cli, minimal-agent-mind-model, simulated-collaborators.

## Phases

### Phase 1: Single-Player Companionship
- Flesh out `proposeActorAction` per simulated-collaborators plan — return real proposals, not stubs
- Add `getActorGuidance(flow, currentNodeId, roleId, questState)` for UI integration
- Wire actor guidance into onboarding/quest flows where single-player needs it
- UI: "Librarian suggests…" (simulated) — clear labeling
- **Deliverable**: Single-player can receive guidance from simulated collaborators in flows

### Phase 2: Simulated Player Cohort
- Schema: add `creatorType: 'human' | 'agent'` or `isAgent` to Player
- Seed script: create N simulated players with varied nation/archetype
- Run `simulateAgentGameLoop` for each; validate market/thread activity
- Optional: admin UI to view/run simulation cohort
- **Deliverable**: Populated world for single-player testing; stress-test before real players

### Phase 3: NPC Content Proposal
- Agent-facing entry point to BAR/quest pipeline (Admin Agent Forge or BAR→Quest Engine)
- Persona-driven generation: nation, archetype, goal from minimal-agent-mind-model
- Admin approval gate before publication
- Schema: `proposedByAgentId` or `createdByAgentId` on BAR/quest records
- **Deliverable**: NPCs propose content; admin curates; single-player sees varied voices

## Dependencies

| Spec | Use |
|------|-----|
| npc-agent-game-loop-simulation | pickQuestForAgent, simulateAgentGameLoop |
| flow-simulator-cli | simulateFlow, getSimulatedActorRole |
| simulated-collaborators | proposeActorAction, getActorGuidance |
| minimal-agent-mind-model | agent state, persona variables |
| Admin Agent Forge / BAR→Quest Engine | content proposal pipeline |

## Risk Mitigation

- **Boundary bleed**: Schema markers from Phase 2; audit trail on all agent-created records
- **Scope creep**: Agents propose only; no autonomous publication
- **Maintenance**: Reuse existing pipelines; no forked paths
