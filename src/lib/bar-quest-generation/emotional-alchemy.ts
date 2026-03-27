/**
 * Emotional alchemy resolution for BAR → Quest proposals and QuestWizard alignment
 * @see .specify/specs/bar-quest-generation-engine/spec.md Part 5
 * Uses canonical resolveMoveForContext from quest-grammar
 */

import { db } from '@/lib/db'
import { resolveMoveForContext } from '@/lib/quest-grammar'
import type { EmotionalAlchemyResult } from './types'

const GM_LENS_KEYS = new Set([
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
])

/** Prefer orientation lens, then hub portal face, then active_face from CYOA depth nodes. */
export function pickGmLensFromStoryState(
  state: Record<string, unknown> | undefined,
): string | undefined {
  if (!state) return undefined
  const candidates = [state.lens, state.hub_portal_face, state.active_face]
  for (const c of candidates) {
    if (typeof c !== 'string' || !c.trim()) continue
    const k = c.trim().toLowerCase()
    if (GM_LENS_KEYS.has(k)) return k
  }
  return undefined
}

async function getLensFromPlayer(playerId: string): Promise<string | undefined> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { storyProgress: true },
  })
  if (!player?.storyProgress) return undefined
  try {
    const parsed = JSON.parse(player.storyProgress) as { state?: Record<string, unknown> }
    return pickGmLensFromStoryState(parsed?.state)
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
