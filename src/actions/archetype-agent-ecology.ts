'use server'

import { db } from '@/lib/db'
import { createAgent } from '@/lib/agent-mind/createAgent'
import { selectAgentAction, integrateAgentResult } from '@/lib/agent-mind/actions'
import { generateNarrativeLock } from '@/lib/agent-mind/narrativeTriggers'
import { generateNpcName } from '@/lib/npc-name-grammar'
import { proposeBarFromAgent } from '@/actions/agent-content-proposal'
import { getEligibleQuestsForActor } from '@/actions/quest-eligibility'
import {
  buildAgentPersonaFromArchetype,
  profileToAgentInput,
  type ArchetypeAgentProfile,
} from '@/lib/archetype-agent-ecology'
import type { AgentMindState } from '@/lib/agent-mind/types'

// ---------------------------------------------------------------------------
// spawnArchetypeAgent
// ---------------------------------------------------------------------------

export interface SpawnArchetypeAgentOpts {
  instanceId?: string
  inviteId?: string
}

export async function spawnArchetypeAgent(
  archetypeId: string,
  opts: SpawnArchetypeAgentOpts = {}
): Promise<{ success: true; agentId: string; agentMind: AgentMindState; profile: ArchetypeAgentProfile } | { error: string }> {
  const archetype = await db.archetype.findUnique({
    where: { id: archetypeId },
    select: {
      id: true,
      name: true,
      showUp: true,
      shadowSignposts: true,
      primaryWaveStage: true,
      players: {
        where: { nationId: { not: null } },
        select: { nation: { select: { name: true } } },
        take: 1,
      },
    },
  })
  if (!archetype) return { error: 'Archetype not found' }

  const nationName = archetype.players[0]?.nation?.name ?? 'Unknown'
  const profile = buildAgentPersonaFromArchetype(archetype, nationName)

  // Need a placeholder invite for Player creation
  let inviteId = opts.inviteId
  if (!inviteId) {
    const systemInvite = await db.invite.findFirst({ select: { id: true } })
    if (!systemInvite) return { error: 'No invite record available for agent player creation' }
    inviteId = systemInvite.id
  }

  // Create the NPC Player
  const tempId = `agent_${Date.now().toString(36)}`
  const npcName = generateNpcName(tempId, nationName.toLowerCase(), profile.face, 1)

  const agentPlayer = await db.player.create({
    data: {
      name: npcName.formalName,
      creatorType: 'agent',
      contactType: 'simulated',
      contactValue: `simulated_agent_${tempId}`,
      inviteId,
      onboardingComplete: true,
    },
    select: { id: true },
  })

  // Build mind state from archetype
  const agentInput = profileToAgentInput(profile, agentPlayer.id)
  const agentMind = createAgent(agentInput)

  return { success: true, agentId: agentPlayer.id, agentMind, profile }
}

// ---------------------------------------------------------------------------
// runAgentCycle
// ---------------------------------------------------------------------------

export interface RunAgentCycleOpts {
  campaignRef?: string
  allyshipDomain?: string
}

export interface AgentCycleOutcome {
  agentId: string
  actionKind: string
  actionLabel: string
  outcome: string
  updatedMind: AgentMindState
}

/**
 * One step of the agent cycle:
 * 1. Load agent player + archetype context
 * 2. Reconstruct a minimal AgentMindState from DB fields
 * 3. selectAgentAction → action kind
 * 4. Execute: observe → get eligible quests; experiment → propose BAR; integrate → update narrative
 * 5. integrateAgentResult → return updated mind
 */
export async function runAgentCycle(
  agentId: string,
  opts: RunAgentCycleOpts = {}
): Promise<AgentCycleOutcome | { error: string }> {
  const agent = await db.player.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      creatorType: true,
      nation: { select: { name: true } },
      archetype: { select: { name: true, primaryWaveStage: true, showUp: true, shadowSignposts: true } },
    },
  })
  if (!agent) return { error: 'Agent not found' }
  if (agent.creatorType !== 'agent') return { error: 'Player is not an agent' }

  // Reconstruct minimal mind state from DB
  const archetype = agent.archetype
  const nationName = agent.nation?.name ?? 'Unknown'
  const profile = archetype
    ? buildAgentPersonaFromArchetype(
        { id: '', name: archetype.name, showUp: archetype.showUp, shadowSignposts: archetype.shadowSignposts, primaryWaveStage: archetype.primaryWaveStage },
        nationName
      )
    : null

  const mind = createAgent({
    agent_id: agentId,
    nation: nationName,
    archetype: archetype?.name ?? 'Unknown',
    goal: profile?.goal ?? `Show up for ${nationName}`,
    narrative_lock: profile?.narrativeLock ?? 'Still finding my way.',
    emotional_state: profile?.emotionalState ?? 'neutrality',
    energy: 0.5,
  })

  const action = selectAgentAction(mind)
  let outcome = ''
  let updatedMind: AgentMindState = mind

  switch (action.action_kind) {
    case 'observe': {
      // Query eligible quests — agent observes the quest landscape
      const quests = await getEligibleQuestsForActor(agentId, { limit: 5 })
      const questCount = 'error' in quests ? 0 : quests.length
      outcome = `Observed ${questCount} eligible quest${questCount !== 1 ? 's' : ''}.`
      updatedMind = integrateAgentResult(mind, { insight_note: outcome, energy_delta: 0.05 })
      break
    }

    case 'experiment': {
      // Propose a BAR from agent persona
      if (profile) {
        const result = await proposeBarFromAgent(
          agentId,
          {
            nationId: '',
            archetypeId: '',
            goal: profile.goal,
            narrativeLock: profile.narrativeLock,
            emotionalState: profile.emotionalState,
            energy: mind.energy,
          },
          { campaignRef: opts.campaignRef, allyshipDomain: opts.allyshipDomain ?? profile.allyshipDomain }
        )
        if ('success' in result && result.success) {
          outcome = `Proposed BAR: ${result.barId}`
          updatedMind = integrateAgentResult(mind, { bar_id: result.barId, energy_delta: -0.1 })
        } else {
          outcome = 'BAR proposal failed'
          updatedMind = integrateAgentResult(mind, { insight_note: 'Experiment did not land', energy_delta: -0.05 })
        }
      } else {
        outcome = 'No archetype context — skipped experiment'
        updatedMind = integrateAgentResult(mind, { energy_delta: 0 })
      }
      break
    }

    case 'rest': {
      // Update narrative to a recovery state
      const newLock = generateNarrativeLock(mind, 'low_energy')
      updatedMind = integrateAgentResult({ ...mind, narrative_lock: newLock }, { energy_delta: 0.15 })
      outcome = 'Agent resting — narrative updated.'
      break
    }

    case 'integrate':
    default: {
      // Synthesize insight from existing bars
      const newLock = generateNarrativeLock(mind, 'social_interaction')
      updatedMind = integrateAgentResult({ ...mind, narrative_lock: newLock }, { insight_note: 'Integrating field observations.', energy_delta: 0.05 })
      outcome = 'Agent integrated recent learning.'
      break
    }
  }

  return { agentId, actionKind: action.action_kind, actionLabel: action.label, outcome, updatedMind }
}

// ---------------------------------------------------------------------------
// assignAgentToEventCampaign
// ---------------------------------------------------------------------------

/**
 * Links an agent player to all events in a campaign as EventParticipant.
 * GH integration — agents become Consulted participants by default.
 */
export async function assignAgentToEventCampaign(
  agentId: string,
  campaignId: string,
  raciRole: string = 'Consulted'
): Promise<{ success: true; assigned: number } | { error: string }> {
  const agent = await db.player.findUnique({
    where: { id: agentId },
    select: { id: true, creatorType: true },
  })
  if (!agent) return { error: 'Agent not found' }
  if (agent.creatorType !== 'agent') return { error: 'Player is not an agent' }

  const campaign = await db.eventCampaign.findUnique({
    where: { id: campaignId },
    select: { events: { select: { id: true } } },
  })
  if (!campaign) return { error: 'Campaign not found' }

  let assigned = 0
  for (const event of campaign.events) {
    const existing = await db.eventParticipant.findUnique({
      where: { eventId_participantId: { eventId: event.id, participantId: agentId } },
      select: { id: true },
    })
    if (existing) {
      await db.eventParticipant.update({
        where: { id: existing.id },
        data: { raciRole },
      })
    } else {
      await db.eventParticipant.create({
        data: {
          eventId: event.id,
          participantId: agentId,
          participantState: 'interested',
          functionalRole: 'observer',
          raciRole,
        },
      })
      assigned++
    }
  }

  return { success: true, assigned }
}

// ---------------------------------------------------------------------------
// getAgentEcologyForCampaign
// ---------------------------------------------------------------------------

export interface AgentEcologyEntry {
  agentId: string
  name: string
  archetypeName: string | null
  nationName: string | null
  primaryWaveStage: string | null
  participantCount: number
  raciRoles: string[]
}

/**
 * Lists all agent players participating in a campaign's events with summary context.
 */
export async function getAgentEcologyForCampaign(
  campaignId: string
): Promise<AgentEcologyEntry[] | { error: string }> {
  const campaign = await db.eventCampaign.findUnique({
    where: { id: campaignId },
    select: { events: { select: { id: true } } },
  })
  if (!campaign) return { error: 'Campaign not found' }

  const eventIds = campaign.events.map((e) => e.id)
  if (eventIds.length === 0) return []

  const participants = await db.eventParticipant.findMany({
    where: {
      eventId: { in: eventIds },
      participant: { creatorType: 'agent' },
    },
    select: {
      eventId: true,
      raciRole: true,
      participant: {
        select: {
          id: true,
          name: true,
          archetype: { select: { name: true, primaryWaveStage: true } },
          nation: { select: { name: true } },
        },
      },
    },
  })

  // Group by agent player
  const agentMap = new Map<string, AgentEcologyEntry>()
  for (const p of participants) {
    const a = p.participant
    if (!agentMap.has(a.id)) {
      agentMap.set(a.id, {
        agentId: a.id,
        name: a.name,
        archetypeName: a.archetype?.name ?? null,
        nationName: a.nation?.name ?? null,
        primaryWaveStage: a.archetype?.primaryWaveStage ?? null,
        participantCount: 0,
        raciRoles: [],
      })
    }
    const entry = agentMap.get(a.id)!
    entry.participantCount++
    if (p.raciRole && !entry.raciRoles.includes(p.raciRole)) {
      entry.raciRoles.push(p.raciRole)
    }
  }

  return Array.from(agentMap.values())
}
