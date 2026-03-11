'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { Metadata321 } from '@/lib/quest-grammar'
import type { UnpackingAnswers } from '@/lib/quest-grammar'
import { extractCreationIntent } from '@/lib/creation-quest'

export type Shadow321SessionInput = {
  phase3Snapshot: string
  phase2Snapshot: string
  outcome: 'bar_created' | 'quest_created' | 'fueled_system' | 'skipped'
  linkedBarId?: string | null
  linkedQuestId?: string | null
}

/**
 * Persist a 321 session for metabolizability learning.
 * Called by createQuestFrom321Metadata, fuelSystemFrom321, and post-321 when Create BAR chosen.
 */
export async function persist321Session(
  data: Shadow321SessionInput
): Promise<{ success: true; sessionId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    const session = await db.shadow321Session.create({
      data: {
        playerId: player.id,
        phase3Snapshot: data.phase3Snapshot,
        phase2Snapshot: data.phase2Snapshot,
        outcome: data.outcome,
        linkedBarId: data.linkedBarId ?? null,
        linkedQuestId: data.linkedQuestId ?? null,
      },
    })
    return { success: true, sessionId: session.id }
  } catch (e: unknown) {
    console.error('[charge-metabolism] persist321Session failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to persist 321 session',
    }
  }
}

export type Phase3Taxonomic = {
  archetypeName?: string
  nationName?: string
  identityFreeText?: string
  developmentalLens?: string
  genderOfCharge?: string
}

/**
 * Create a quest from 321 metadata.
 * Uses extractCreationIntent when phase2 provided for moveType.
 * Assigns to player and links via source321SessionId.
 */
export async function createQuestFrom321Metadata(
  metadata: Metadata321,
  phase2?: UnpackingAnswers & { alignedAction?: string },
  phase3?: Phase3Taxonomic
): Promise<{ success: true; questId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const title = metadata.title || 'Quest from 321'
  const description = metadata.description || ''

  let moveType: string | undefined
  if (phase2) {
    const intent = extractCreationIntent({
      ...phase2,
      alignedAction: phase2.alignedAction,
    })
    if (intent.moveType) {
      moveType = intent.moveType
    }
  }

  try {
    const quest = await db.customBar.create({
      data: {
        creatorId: player.id,
        title,
        description,
        type: 'quest',
        moveType: moveType ?? undefined,
        reward: 1,
        visibility: 'private',
        status: 'active',
        claimedById: player.id,
      },
    })

    await db.playerQuest.create({
      data: {
        playerId: player.id,
        questId: quest.id,
        status: 'assigned',
      },
    })

    const phase3Snapshot = JSON.stringify(phase3 ?? {})
    const phase2Snapshot = phase2 ? JSON.stringify(phase2) : JSON.stringify({ title: metadata.title, description: metadata.description })

    const persistResult = await persist321Session({
      phase3Snapshot,
      phase2Snapshot,
      outcome: 'quest_created',
      linkedQuestId: quest.id,
    })

    if ('success' in persistResult && persistResult.success) {
      await db.customBar.update({
        where: { id: quest.id },
        data: { source321SessionId: persistResult.sessionId },
      })
    }

    revalidatePath('/')
    revalidatePath('/hand')
    return { success: true, questId: quest.id }
  } catch (e: unknown) {
    console.error('[charge-metabolism] createQuestFrom321Metadata failed:', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to create quest from 321',
    }
  }
}

/**
 * Fuel the system with 321 charge (learning pipeline).
 * Persists Shadow321Session with outcome fueled_system.
 */
export async function fuelSystemFrom321(
  metadata: Metadata321,
  _context?: { isAdmin?: boolean }
): Promise<{ success: true; sessionId?: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const phase3Snapshot = '{}'
  const phase2Snapshot = JSON.stringify({
    title: metadata.title,
    description: metadata.description,
    tags: metadata.tags,
  })

  const result = await persist321Session({
    phase3Snapshot,
    phase2Snapshot,
    outcome: 'fueled_system',
  })

  if ('success' in result && result.success) {
    revalidatePath('/')
    return { success: true, sessionId: result.sessionId }
  }
  return result
}
