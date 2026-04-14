/**
 * Alchemy Engine — shared types and pure phase/move helpers (vertical slice: Challenger + Wake Up).
 * Used by tests and server actions when that slice is present.
 */

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
