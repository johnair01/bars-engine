/**
 * Emotional alchemy resolution for BAR → Quest proposals and QuestWizard alignment
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

const UNRESOLVED: EmotionalAlchemyResult = {
  status: 'unresolved',
  moveId: null,
  moveName: null,
  prompt: null,
  completionReflection: null,
}

/**
 * Canonical emotional alchemy for a player context (QuestWizard, BAR pipeline, etc.).
 * Uses allyship domain + GM lens from player story progress. Does not throw.
 */
export async function resolveEmotionalAlchemyForPlayerContext(params: {
  playerId: string
  allyshipDomain: string
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
      return { ...UNRESOLVED }
    }

    return {
      status: 'resolved',
      moveId: move.id,
      moveName: move.name,
      prompt: move.narrative,
      completionReflection: `Reflect on how ${move.name} shaped this moment.`,
    }
  } catch {
    return { ...UNRESOLVED }
  }
}

/** Alias for BAR pipeline; identical to {@link resolveEmotionalAlchemyForPlayerContext}. */
export async function resolveEmotionalAlchemyForBar(params: {
  allyshipDomain: string
  playerId: string
  campaignPhase?: number
}): Promise<EmotionalAlchemyResult> {
  return resolveEmotionalAlchemyForPlayerContext(params)
}

export type WizardEmotionalAlchemyCompletionPayload = {
  status: EmotionalAlchemyResult['status']
  moveId: string | null
  moveName: string | null
  prompt: string | null
  completionReflection: string | null
  chosenMoveType: string | null
  source: 'quest_wizard'
}

/**
 * Shape stored under completionEffects.emotionalAlchemy for QuestWizard-created quests.
 */
export function buildWizardEmotionalAlchemyCompletionPayload(
  ea: EmotionalAlchemyResult,
  chosenMoveType: string | null
): WizardEmotionalAlchemyCompletionPayload {
  return {
    status: ea.status,
    moveId: ea.moveId,
    moveName: ea.moveName,
    prompt: ea.prompt,
    completionReflection: ea.completionReflection,
    chosenMoveType,
    source: 'quest_wizard',
  }
}
