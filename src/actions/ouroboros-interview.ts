'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { deriveAvatarConfig } from '@/lib/avatar-utils'
import { getPlaybookForArchetype } from './playbook'
import { OUROBOROS_NODES, type OuroborosNodeId, type OuroborosInterviewState } from '@/lib/ouroboros-interview'

export async function getOuroborosInterviewState(
  playerId: string
): Promise<OuroborosInterviewState | { error: string }> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: {
      storyProgress: true,
      nationId: true,
      archetypeId: true,
      campaignDomainPreference: true,
    },
  })

  if (!player) return { error: 'Player not found' }

  let ouroboros: Partial<OuroborosInterviewState> = {}
  if (player.storyProgress) {
    try {
      const parsed = JSON.parse(player.storyProgress) as { ouroboros?: Partial<OuroborosInterviewState> }
      ouroboros = parsed?.ouroboros ?? {}
    } catch {
      // ignore
    }
  }

  const currentNodeId = (ouroboros.currentNodeId ?? 'OUROBOROS_START') as OuroborosNodeId
  const answers = ouroboros.answers ?? {}

  // If player already has nation/archetype and we're at start, we might be "re-doing" or first visit
  const hasIdentity = !!(player.nationId && player.archetypeId)
  const effectiveNode =
    hasIdentity && currentNodeId === 'OUROBOROS_START' ? 'OUROBOROS_COMPLETE' : currentNodeId

  let domainPreference: string[] = []
  if (player.campaignDomainPreference) {
    try {
      const parsed = JSON.parse(player.campaignDomainPreference) as unknown
      domainPreference = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      // ignore
    }
  }

  return {
    currentNodeId: effectiveNode,
    answers: {
      ...answers,
      nationId: answers.nationId ?? player.nationId ?? undefined,
      archetypeId: answers.archetypeId ?? player.archetypeId ?? undefined,
      domainPreference: answers.domainPreference ?? domainPreference,
    },
    archetypeId: player.archetypeId ?? undefined,
    nationId: player.nationId ?? undefined,
    domainPreference: domainPreference.length > 0 ? domainPreference : undefined,
  }
}

export async function advanceOuroborosInterview(
  playerId: string,
  nodeId: OuroborosNodeId,
  answer: Record<string, unknown>
): Promise<{ success: boolean; nextNodeId?: OuroborosNodeId; error?: string }> {
  const currentUser = await getCurrentPlayer()
  if (!currentUser || currentUser.id !== playerId) return { success: false, error: 'Not authorized' }

  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { id: true, storyProgress: true },
  })
  if (!player) return { success: false, error: 'Player not found' }

  const currentState = await getOuroborosInterviewState(playerId)
  if ('error' in currentState) return { success: false, error: currentState.error }

  const idx = OUROBOROS_NODES.indexOf(nodeId)
  if (idx < 0) return { success: false, error: 'Invalid node' }

  const updates: Partial<OuroborosInterviewState['answers']> = { ...currentState.answers }

  if (answer.lens && typeof answer.lens === 'string') updates.lens = answer.lens
  if (answer.nationId && typeof answer.nationId === 'string') updates.nationId = answer.nationId
  if (answer.archetypeId && typeof answer.archetypeId === 'string') updates.archetypeId = answer.archetypeId
  if (Array.isArray(answer.domainPreference)) {
    updates.domainPreference = answer.domainPreference.filter((x): x is string => typeof x === 'string')
  }

  let nextNodeId: OuroborosNodeId
  const nextIdx = idx + 1

  if (nodeId === 'OUROBOROS_COMPLETE') {
    nextNodeId = 'OUROBOROS_COMPLETE'
  } else if (nextIdx >= OUROBOROS_NODES.length) {
    nextNodeId = 'OUROBOROS_COMPLETE'
  } else {
    nextNodeId = OUROBOROS_NODES[nextIdx]
  }

  // Merge into storyProgress
  let storyProgress: Record<string, unknown> = {}
  if (player.storyProgress) {
    try {
      storyProgress = JSON.parse(player.storyProgress) as Record<string, unknown>
    } catch {
      // ignore
    }
  }

  storyProgress.ouroboros = {
    currentNodeId: nextNodeId,
    answers: updates,
  }

  // On completion, persist to Player
  if (nextNodeId === 'OUROBOROS_COMPLETE' && (updates.nationId || updates.archetypeId)) {
    const nation = updates.nationId
      ? await db.nation.findUnique({ where: { id: updates.nationId }, select: { name: true } })
      : null
    const archetype = updates.archetypeId
      ? await db.archetype.findUnique({ where: { id: updates.archetypeId }, select: { name: true } })
      : null

    const avatarConfig = deriveAvatarConfig(
      updates.nationId,
      updates.archetypeId,
      updates.domainPreference?.length ? JSON.stringify(updates.domainPreference) : null,
      { nationName: nation?.name, archetypeName: archetype?.name }
    )

    await db.player.update({
      where: { id: playerId },
      data: {
        storyProgress: JSON.stringify(storyProgress),
        nationId: updates.nationId ?? undefined,
        archetypeId: updates.archetypeId ?? undefined,
        campaignDomainPreference:
          updates.domainPreference?.length ? JSON.stringify(updates.domainPreference) : undefined,
        avatarConfig: avatarConfig ?? undefined,
      },
    })
  } else {
    await db.player.update({
      where: { id: playerId },
      data: { storyProgress: JSON.stringify(storyProgress) },
    })
  }

  revalidatePath('/character/create')
  revalidatePath('/')
  return { success: true, nextNodeId }
}
