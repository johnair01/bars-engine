'use server'

/**
 * NPC Content Proposal — Agent-facing entry point for BAR/quest generation.
 * Agents propose content; admin approves before publication.
 * @see .specify/specs/npc-simulated-player-content-ecology/spec.md Phase 3
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface AgentPersona {
  nationId: string
  archetypeId: string
  goal: string
  narrativeLock: string
  emotionalState?: 'fear' | 'anger' | 'sadness' | 'neutrality' | 'joy'
  energy?: number
}

/** Deterministic persona-driven title/description. No LLM in v1. */
function generateFromPersona(persona: AgentPersona): { title: string; description: string } {
  const { goal, narrativeLock, emotionalState = 'neutrality', energy = 0.7 } = persona
  const moveBias = energy > 0.6 ? 'action' : 'reflection'
  const title = `From the Field: ${goal.slice(0, 40)}${goal.length > 40 ? '…' : ''}`
  const description = [
    `**Intention:** ${goal}`,
    `**Obstacle:** ${narrativeLock}`,
    `**Energy:** ${energy > 0.6 ? 'Ready to act' : 'Reflecting'}`,
    `**Suggested move:** ${moveBias === 'action' ? 'Take one small step toward this goal.' : 'Pause and name what you notice.'}`,
    '',
    '_Proposed by simulated agent. Pending admin approval._',
  ].join('\n\n')
  return { title, description: description.replace(/_Proposed by.*_/, '').trim() }
}

/**
 * Propose a BAR/quest from an agent persona.
 * Creates CustomBar with status='agent_proposed', proposedByAgentId.
 * Callable by scripts or admin (not by regular players in v1).
 */
export async function proposeBarFromAgent(
  agentId: string,
  persona: AgentPersona,
  options?: { campaignRef?: string; allyshipDomain?: string }
): Promise<{ success: true; barId: string } | { success: false; error: string }> {
  const agent = await db.player.findUnique({
    where: { id: agentId },
    select: { id: true, creatorType: true, nationId: true, archetypeId: true },
  })
  if (!agent) return { success: false, error: 'Agent player not found' }
  if (agent.creatorType !== 'agent') {
    return { success: false, error: 'Player must have creatorType=agent to propose content' }
  }

  const { title, description } = generateFromPersona(persona)

  const bar = await db.customBar.create({
    data: {
      creatorId: agentId,
      proposedByAgentId: agentId,
      title,
      description,
      type: 'vibe',
      reward: 1,
      visibility: 'private',
      status: 'agent_proposed',
      inputs: JSON.stringify([{ key: 'response', label: 'Response', type: 'text', placeholder: '' }]),
      moveType: persona.energy && persona.energy > 0.6 ? 'showUp' : 'growUp',
      campaignRef: options?.campaignRef ?? null,
      allyshipDomain: options?.allyshipDomain ?? 'GATHERING_RESOURCES',
      completionEffects: JSON.stringify({
        proposedByAgent: true,
        agentPersona: {
          goal: persona.goal,
          narrativeLock: persona.narrativeLock,
          emotionalState: persona.emotionalState,
          energy: persona.energy,
        },
        createdAt: new Date().toISOString(),
      }),
      rootId: 'temp',
    },
  })

  await db.customBar.update({
    where: { id: bar.id },
    data: { rootId: bar.id },
  })

  return { success: true, barId: bar.id }
}

/** List BARs proposed by agents, pending approval. Admin only. */
export async function listAgentProposals() {
  const player = await getCurrentPlayer()
  if (!player) return []
  const adminRole = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
  })
  if (!adminRole) return []

  return db.customBar.findMany({
    where: {
      proposedByAgentId: { not: null },
      status: 'agent_proposed',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          nationId: true,
          archetypeId: true,
          nation: { select: { name: true } },
          archetype: { select: { name: true } },
        },
      },
    },
  })
}

/** Approve an agent-proposed BAR. Sets status=active, visibility=public. Admin only. */
export async function approveAgentProposal(
  barId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }
  const adminRole = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
  })
  if (!adminRole) return { success: false, error: 'Admin only' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, proposedByAgentId: true, status: true },
  })
  if (!bar) return { success: false, error: 'BAR not found' }
  if (!bar.proposedByAgentId) return { success: false, error: 'Not an agent proposal' }
  if (bar.status !== 'agent_proposed') return { success: false, error: 'Already processed' }

  await db.customBar.update({
    where: { id: barId },
    data: { status: 'active', visibility: 'public' },
  })

  revalidatePath('/admin/agent-proposals')
  revalidatePath('/admin/quest-proposals')
  revalidatePath('/bars/available')
  return { success: true }
}

/** Reject an agent-proposed BAR. Sets status=archived or similar. Admin only. */
export async function rejectAgentProposal(
  barId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }
  const adminRole = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
  })
  if (!adminRole) return { success: false, error: 'Admin only' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, proposedByAgentId: true, status: true },
  })
  if (!bar) return { success: false, error: 'BAR not found' }
  if (!bar.proposedByAgentId) return { success: false, error: 'Not an agent proposal' }
  if (bar.status !== 'agent_proposed') return { success: false, error: 'Already processed' }

  await db.customBar.update({
    where: { id: barId },
    data: { status: 'archived', archivedAt: new Date() },
  })

  revalidatePath('/admin/agent-proposals')
  return { success: true }
}
