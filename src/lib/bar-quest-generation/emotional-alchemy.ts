/**
 * Emotional alchemy resolution for BAR → Quest proposals
 * @see .specify/specs/bar-quest-generation-engine/spec.md Part 5
 * Uses canonical resolveMoveForContext from quest-grammar
 */

import { db } from '@/lib/db'
import { resolveMoveForContext } from '@/lib/quest-grammar'
import type { EmotionalAlchemyResult } from './types'

async function getLensFromPlayer(playerId: string): Promise<string | undefined> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { storyProgress: true },
  })
  if (!player?.storyProgress) return undefined
  try {
    const parsed = JSON.parse(player.storyProgress) as { state?: { lens?: string } }
    return parsed?.state?.lens
  } catch {
    return undefined
  }
}

/**
 * Resolve emotional alchemy move for a BAR-based quest proposal.
 * Uses domain + player lens. On failure returns unresolved (does not throw).
 */
export async function resolveEmotionalAlchemyForBar(params: {
  allyshipDomain: string
  playerId: string
  campaignPhase?: number
}): Promise<EmotionalAlchemyResult> {
  try {
    const lens = await getLensFromPlayer(params.playerId)
    const move = resolveMoveForContext({
      allyshipDomain: params.allyshipDomain,
      lens,
      campaignPhase: params.campaignPhase,
    })

    if (!move) {
      return {
        status: 'unresolved',
        moveId: null,
        moveName: null,
        prompt: null,
        completionReflection: null,
      }
    }

    return {
      status: 'resolved',
      moveId: move.id,
      moveName: move.name,
      prompt: move.narrative,
      completionReflection: `Reflect on how ${move.name} shaped this moment.`,
    }
  } catch {
    return {
      status: 'unresolved',
      moveId: null,
      moveName: null,
      prompt: null,
      completionReflection: null,
    }
  }
}
