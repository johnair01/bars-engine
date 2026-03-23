# Tasks: Archetype Agent Ecology v0 (GI)

## Phase 1: Library

- [x] **GI-1.1** `src/lib/archetype-agent-ecology.ts` — `ArchetypeAgentProfile` type
- [x] **GI-1.2** `waveStageToEmotionalState()`, `waveStageToFace()` mappings
- [x] **GI-1.3** `buildAgentPersonaFromArchetype()` — seeds AgentMindState from archetype fields

## Phase 2: Actions

- [x] **GI-2.1** `src/actions/archetype-agent-ecology.ts` — `spawnArchetypeAgent(archetypeId, opts?)`
- [x] **GI-2.2** `runAgentCycle(agentId, opts?)` — selectAction → execute → integrate
- [x] **GI-2.3** `assignAgentToEventCampaign(agentId, campaignId, raciRole?)` — GH integration
- [x] **GI-2.4** `getAgentEcologyForCampaign(campaignId)` — list agents in campaign events

## Verification

- [x] `npx tsc --noEmit` passes on new files
- [x] `npx eslint` passes on new files
