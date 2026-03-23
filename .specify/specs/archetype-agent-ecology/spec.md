# Spec: Archetype Agent Ecology v0 (GI)

## Purpose

Each archetype in the system can spawn an AI agent persona — a simulated Player with `creatorType='agent'` whose behavior is deterministically driven by that archetype's properties (`primaryWaveStage`, move descriptions, shadow signposts). Agents can propose BARs (via NSPE/`proposeBarFromAgent`), participate in event campaigns (via GH), and be assigned eligible quests (via GC). This creates a minimal "companionship ecology" that runs alongside human players.

## Depends on

- **FO** — `agent-mind` library (AgentMindState, createAgent, selectAgentAction, integrateAgentResult)
- **GC** — `getEligibleQuestsForActor` for queue-driven quest assignment
- **GH** — `syncEventParticipantRolesFromBarResponses`, `EventParticipant` model

## Schema: none
Uses existing `Player.creatorType='agent'`, `CustomBar.proposedByAgentId`, and `EventParticipant`.

## Existing infrastructure (no re-implementation)

- `proposeBarFromAgent` / `listAgentProposals` / `approveAgentProposal` / `rejectAgentProposal` — already in `agent-content-proposal.ts`
- `npc-name-grammar.ts` — deterministic name generation
- `agent-mind/` — `AgentMindState`, `selectAgentAction`, `integrateAgentResult`

## Agent persona seeding from archetype

When spawning an agent from an archetype:
- `goal` = archetype's `showUp` field (the fully-expressed aspiration)
- `narrative_lock` = archetype's `shadowSignposts` (first line — the stuck state)
- `emotional_state` = mapped from `primaryWaveStage` (wakeUp → fear, cleanUp → anger, growUp → sadness, showUp → joy)
- `energy` = 0.5 (neutral start)
- `nation` = archetype's nation name (first associated player's nation, or 'Unknown')
- Face = `primaryWaveStage` → Game Master face mapping

## API contract

### `spawnArchetypeAgent(archetypeId, opts?)`
- Creates NPC Player with name from `npc-name-grammar`
- Seeds `AgentMindState` from archetype properties
- Returns `{ agentId, agentMind }`

### `runAgentCycle(agentId, opts?)`
- Load current mind state from `agent-mind` library
- `selectAgentAction(mind)` → action kind
- Execute: `observe` → get eligible quests (GC); `experiment` → proposeBarFromAgent; `integrate` → update narrative lock
- Returns `{ action, outcome }`

### `assignAgentToEventCampaign(agentId, campaignId, raciRole?)`
- Links agent to all events in a campaign as `EventParticipant`
- `raciRole` defaults to `'Consulted'` (agent provides counsel)
- Returns `{ assigned: number }`

### `getAgentEcologyForCampaign(campaignId)`
- Lists all agent players participating in the campaign's events
- Returns array of `{ agentId, name, archetypeName, nationName, participantCount }`

## Non-goals (v0)
- LLM-powered agent reasoning (all rule-based)
- Automated approval of agent-proposed content
- Agent-to-agent messaging
