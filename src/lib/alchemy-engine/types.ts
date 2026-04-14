/**
 * Alchemy Engine — shared types and pure phase/move helpers (vertical slice: Challenger + Wake Up).
 * Used by tests and server actions when that slice is present.
 */

import type { EmotionalChannel, GameMasterFace, PersonalMoveType } from '@/lib/quest-grammar/types'

export type ChallengerMoveId = 'issue_challenge' | 'propose_move'

export const CHALLENGER_MOVE_IDS: ChallengerMoveId[] = ['issue_challenge', 'propose_move']

export function isChallengerMoveId(x: unknown): x is ChallengerMoveId {
  return x === 'issue_challenge' || x === 'propose_move'
}

export const CHALLENGER_MOVE_META: Record<
  ChallengerMoveId,
  {
    canonicalMoveId: string
    title: string
    energyDelta: number
    element: string
    narrative: string
  }
> = {
  issue_challenge: {
    canonicalMoveId: 'fire_transcend',
    title: 'Issue challenge',
    energyDelta: 2,
    element: 'fire',
    narrative: 'Direct confrontation — achieve breakthrough.',
  },
  propose_move: {
    canonicalMoveId: 'wood_fire',
    title: 'Propose move',
    energyDelta: 1,
    element: 'fire',
    narrative: 'Strategic momentum — declare intention.',
  },
}

export type ArcPhase = 'intake' | 'action' | 'reflection'
export type RegulationState = 'dissatisfied' | 'neutral' | 'satisfied'

export const ARC_PHASES: ArcPhase[] = ['intake', 'action', 'reflection']

export const PHASE_INDEX: Record<ArcPhase, number> = {
  intake: 0,
  action: 1,
  reflection: 2,
}

export function isArcPhase(x: unknown): x is ArcPhase {
  return x === 'intake' || x === 'action' || x === 'reflection'
}

export function isRegulationState(x: unknown): x is RegulationState {
  return x === 'dissatisfied' || x === 'neutral' || x === 'satisfied'
}

/** BAR `type` field for each arc phase (identity for channel-typed BARs). */
export type PhaseBarType = ArcPhase

export const PHASE_BAR_CHANNEL_TYPE: Record<ArcPhase, PhaseBarType> = {
  intake: 'intake',
  action: 'action',
  reflection: 'reflection',
}

/** Default arc slice: Challenger face + Wake Up WAVE, starting dissatisfied. */
export const VERTICAL_SLICE = {
  face: 'challenger',
  waveMove: 'wakeUp',
  initialRegulation: 'dissatisfied',
} as const satisfies {
  face: GameMasterFace
  waveMove: PersonalMoveType
  initialRegulation: RegulationState
}

export type AlchemyEngineState = {
  playerId: string
  channel: EmotionalChannel
  regulation: RegulationState
  arcPhase: ArcPhase | null
  waveMove: PersonalMoveType | null
  face: GameMasterFace | null
  arcStartedAt: Date | null
  arcCompletedAt: Date | null
}

export type PhaseAdvanceResult =
  | {
      success: true
      newPhase: ArcPhase | null
      newRegulation: RegulationState
      arcComplete: boolean
    }
  | {
      success: false
      newPhase: ArcPhase | null
      newRegulation: RegulationState
      arcComplete: boolean
      error: string
    }

export const PHASE_REGULATION_MAP: Record<
  ArcPhase,
  { from: RegulationState; to: RegulationState }
> = {
  intake: { from: 'dissatisfied', to: 'neutral' },
  action: { from: 'neutral', to: 'neutral' },
  reflection: { from: 'neutral', to: 'satisfied' },
}

export function canAdvancePhase(phase: ArcPhase, regulation: RegulationState): boolean {
  const map = PHASE_REGULATION_MAP[phase]
  return regulation === map.from
}

export function regulationAfterPhase(phase: ArcPhase): RegulationState {
  return PHASE_REGULATION_MAP[phase].to
}

export function nextPhase(phase: ArcPhase): ArcPhase | null {
  if (phase === 'intake') return 'action'
  if (phase === 'action') return 'reflection'
  return null
}
