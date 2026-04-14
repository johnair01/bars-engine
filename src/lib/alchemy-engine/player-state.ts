/**
 * Alchemy Engine — Player State Management
 *
 * Reads and writes AlchemyPlayerState with arc-tracking fields.
 * Phase-locked: regulation advances ONLY on phase completion.
 */

import { db } from '@/lib/db'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import {
  type AlchemyEngineState,
  type ArcPhase,
  type RegulationState,
  type PhaseAdvanceResult,
  VERTICAL_SLICE,
  PHASE_REGULATION_MAP,
  isArcPhase,
  nextPhase,
  canAdvancePhase,
  regulationAfterPhase,
} from './types'

// Channel mapping: DB uses lowercase, types use title-case
const CHANNEL_DB_TO_TYPE: Record<string, EmotionalChannel> = {
  fear: 'Fear', anger: 'Anger', sadness: 'Sadness', joy: 'Joy', neutrality: 'Neutrality',
}
const CHANNEL_TYPE_TO_DB: Record<EmotionalChannel, string> = {
  Fear: 'fear', Anger: 'anger', Sadness: 'sadness', Joy: 'joy', Neutrality: 'neutrality',
}

/**
 * Get a player's current alchemy engine state.
 * Returns null if the player has no state record.
 */
export async function getEngineState(playerId: string): Promise<AlchemyEngineState | null> {
  const row = await db.alchemyPlayerState.findUnique({ where: { playerId } })
  if (!row) return null

  return {
    playerId: row.playerId,
    channel: CHANNEL_DB_TO_TYPE[row.channel] ?? 'Neutrality',
    regulation: row.altitude as RegulationState,
    arcPhase: isArcPhase(row.arcPhase) ? row.arcPhase : null,
    waveMove: (row.waveMove as AlchemyEngineState['waveMove']) ?? null,
    face: (row.face as AlchemyEngineState['face']) ?? null,
    arcStartedAt: row.arcStartedAt ?? null,
    arcCompletedAt: row.arcCompletedAt ?? null,
  }
}

/**
 * Initialize a new alchemy engine arc for a player.
 * Sets phase to 'intake', regulation to 'dissatisfied',
 * and locks in the face + waveMove for the arc.
 *
 * Vertical slice: defaults to Challenger + Wake Up.
 */
export async function initializeArc(
  playerId: string,
  channel: EmotionalChannel,
  options?: {
    face?: AlchemyEngineState['face']
    waveMove?: AlchemyEngineState['waveMove']
  },
): Promise<AlchemyEngineState> {
  const face = options?.face ?? VERTICAL_SLICE.face
  const waveMove = options?.waveMove ?? VERTICAL_SLICE.waveMove
  const channelDb = CHANNEL_TYPE_TO_DB[channel]
  const now = new Date()

  const row = await db.alchemyPlayerState.upsert({
    where: { playerId },
    create: {
      playerId,
      channel: channelDb,
      altitude: VERTICAL_SLICE.initialRegulation,
      arcPhase: 'intake',
      face,
      waveMove,
      arcStartedAt: now,
      arcCompletedAt: null,
    },
    update: {
      channel: channelDb,
      altitude: VERTICAL_SLICE.initialRegulation,
      arcPhase: 'intake',
      face,
      waveMove,
      arcStartedAt: now,
      arcCompletedAt: null,
    },
  })

  return {
    playerId: row.playerId,
    channel,
    regulation: VERTICAL_SLICE.initialRegulation,
    arcPhase: 'intake',
    waveMove,
    face,
    arcStartedAt: row.arcStartedAt ?? now,
    arcCompletedAt: null,
  }
}

/**
 * Advance the player's arc to the next phase.
 *
 * Phase-locked: validates that current regulation matches the phase prerequisite.
 * On success, advances regulation per PHASE_REGULATION_MAP and moves to the next phase.
 *
 * If the current phase is 'reflection', the arc is complete and regulation → satisfied.
 */
export async function completePhase(playerId: string): Promise<PhaseAdvanceResult> {
  const row = await db.alchemyPlayerState.findUnique({ where: { playerId } })
  if (!row) {
    return { success: false, newPhase: null, newRegulation: 'dissatisfied', arcComplete: false, error: 'No alchemy state found' }
  }

  const currentPhase = row.arcPhase as ArcPhase | null
  if (!currentPhase || !isArcPhase(currentPhase)) {
    return { success: false, newPhase: null, newRegulation: row.altitude as RegulationState, arcComplete: false, error: 'No active arc phase' }
  }

  const currentRegulation = row.altitude as RegulationState
  if (!canAdvancePhase(currentPhase, currentRegulation)) {
    return {
      success: false,
      newPhase: currentPhase,
      newRegulation: currentRegulation,
      arcComplete: false,
      error: `Cannot advance: regulation is '${currentRegulation}', phase '${currentPhase}' requires '${PHASE_REGULATION_MAP[currentPhase].from}'`,
    }
  }

  const newRegulation = regulationAfterPhase(currentPhase)
  const newPhase = nextPhase(currentPhase)
  const arcComplete = newPhase === null

  await db.alchemyPlayerState.update({
    where: { playerId },
    data: {
      altitude: newRegulation,
      arcPhase: newPhase,
      ...(arcComplete ? { arcCompletedAt: new Date() } : {}),
    },
  })

  return {
    success: true,
    newPhase,
    newRegulation,
    arcComplete,
  }
}

/**
 * Reset a player's arc state (for retrying or starting a new arc).
 * Preserves the channel but clears arc tracking fields.
 */
export async function resetArc(playerId: string): Promise<void> {
  await db.alchemyPlayerState.updateMany({
    where: { playerId },
    data: {
      arcPhase: null,
      waveMove: null,
      face: null,
      arcStartedAt: null,
      arcCompletedAt: null,
      altitude: 'dissatisfied',
    },
  })
}
