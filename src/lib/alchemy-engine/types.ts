/**
 * Alchemy Engine — Types
 *
 * 3-phase CYOA arc: Intake → Action → Reflection
 * Phase-locked state advancement: regulation advances ONLY on phase completion.
 * Vertical slice: Challenger face + Wake Up WAVE move.
 *
 * Key invariant: Reflection BAR IS the epiphany (no separate Epiphany model).
 */

import type { AlchemyAltitude } from '@/lib/alchemy/types'
import type { GameMasterFace, PersonalMoveType, EmotionalChannel } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Arc Phase
// ---------------------------------------------------------------------------

/** The 3 phases of an Alchemy Engine arc, in order. */
export const ARC_PHASES = ['intake', 'action', 'reflection'] as const
export type ArcPhase = (typeof ARC_PHASES)[number]

/** Regulation states map 1:1 to altitudes. */
export type RegulationState = AlchemyAltitude // 'dissatisfied' | 'neutral' | 'satisfied'

/**
 * Phase → regulation mapping (phase-locked advancement).
 * Completing a phase advances regulation to the next level.
 *
 *   intake complete     → dissatisfied → neutral
 *   action complete     → neutral      (stays neutral, action builds capacity)
 *   reflection complete → neutral → satisfied (= epiphany)
 */
export const PHASE_REGULATION_MAP: Record<ArcPhase, { from: RegulationState; to: RegulationState }> = {
  intake:     { from: 'dissatisfied', to: 'neutral' },
  action:     { from: 'neutral',      to: 'neutral' },
  reflection: { from: 'neutral',      to: 'satisfied' },
}

/** Phase order index for comparison. */
export const PHASE_INDEX: Record<ArcPhase, number> = {
  intake: 0,
  action: 1,
  reflection: 2,
}

// ---------------------------------------------------------------------------
// Player State (runtime view — matches Prisma AlchemyPlayerState)
// ---------------------------------------------------------------------------

/** Runtime representation of a player's alchemy engine state. */
export interface AlchemyEngineState {
  playerId: string
  /** Current emotional channel (e.g. 'Fear', 'Anger'). */
  channel: EmotionalChannel
  /** Current regulation level = altitude. */
  regulation: RegulationState
  /** Current arc phase, or null if no arc is active. */
  arcPhase: ArcPhase | null
  /** Active WAVE move for this arc. */
  waveMove: PersonalMoveType | null
  /** Active GM face for this arc. */
  face: GameMasterFace | null
  /** When the arc started. */
  arcStartedAt: Date | null
  /** When the arc completed (all 3 phases done). */
  arcCompletedAt: Date | null
}

// ---------------------------------------------------------------------------
// Phase transition
// ---------------------------------------------------------------------------

/** Result of attempting a phase advance. */
export interface PhaseAdvanceResult {
  success: boolean
  /** New phase after advance, or null if arc is complete. */
  newPhase: ArcPhase | null
  /** New regulation after advance. */
  newRegulation: RegulationState
  /** Whether this advance completed the arc (reflection → satisfied). */
  arcComplete: boolean
  /** Error message if advance failed. */
  error?: string
}

// ---------------------------------------------------------------------------
// BAR channel typing
// ---------------------------------------------------------------------------

/** Each phase produces a channel-typed BAR. */
export const PHASE_BAR_CHANNEL_TYPE = {
  intake: 'intake',
  action: 'action',
  reflection: 'reflection',
} as const
export type PhaseBarType = (typeof PHASE_BAR_CHANNEL_TYPE)[keyof typeof PHASE_BAR_CHANNEL_TYPE]

// ---------------------------------------------------------------------------
// Vertical slice constants
// ---------------------------------------------------------------------------

/** Vertical slice defaults: Challenger + Wake Up. */
export const VERTICAL_SLICE = {
  face: 'challenger' as GameMasterFace,
  waveMove: 'wakeUp' as PersonalMoveType,
  /** Initial regulation when arc starts. */
  initialRegulation: 'dissatisfied' as RegulationState,
} as const

// ---------------------------------------------------------------------------
// Challenger move choices (vertical slice)
// ---------------------------------------------------------------------------

/**
 * Valid Challenger move IDs for the Action phase.
 * Scoped to Wake Up WAVE stage per vertical slice.
 */
export const CHALLENGER_MOVE_IDS = ['issue_challenge', 'propose_move'] as const
export type ChallengerMoveId = (typeof CHALLENGER_MOVE_IDS)[number]

/** Validate that a value is a valid Challenger move ID. */
export function isChallengerMoveId(v: unknown): v is ChallengerMoveId {
  return typeof v === 'string' && CHALLENGER_MOVE_IDS.includes(v as ChallengerMoveId)
}

/**
 * Canonical move metadata for each Challenger move.
 * Matches the CHALLENGER_MOVES in ActionPhaseStep.tsx.
 */
export const CHALLENGER_MOVE_META: Record<ChallengerMoveId, {
  canonicalMoveId: string
  title: string
  energyDelta: number
  element: string
  narrative: string
}> = {
  issue_challenge: {
    canonicalMoveId: 'fire_transcend',
    title: 'Issue Challenge',
    energyDelta: 2,
    element: 'fire',
    narrative: 'Anger → boundary honored',
  },
  propose_move: {
    canonicalMoveId: 'wood_fire',
    title: 'Declare Intention',
    energyDelta: 1,
    element: 'fire',
    narrative: 'Momentum into action',
  },
}

// ---------------------------------------------------------------------------
// Guards / helpers
// ---------------------------------------------------------------------------

export function isArcPhase(v: unknown): v is ArcPhase {
  return typeof v === 'string' && ARC_PHASES.includes(v as ArcPhase)
}

export function isRegulationState(v: unknown): v is RegulationState {
  return v === 'dissatisfied' || v === 'neutral' || v === 'satisfied'
}

/**
 * Returns the next phase after the given phase, or null if arc is complete.
 */
export function nextPhase(phase: ArcPhase): ArcPhase | null {
  const idx = PHASE_INDEX[phase]
  if (idx >= ARC_PHASES.length - 1) return null
  return ARC_PHASES[idx + 1] ?? null
}

/**
 * Can the player advance from the current phase?
 * Validates regulation prerequisite for the phase.
 */
export function canAdvancePhase(
  currentPhase: ArcPhase,
  currentRegulation: RegulationState,
): boolean {
  const expected = PHASE_REGULATION_MAP[currentPhase]
  return currentRegulation === expected.from
}

/**
 * Compute the regulation after completing a phase.
 */
export function regulationAfterPhase(phase: ArcPhase): RegulationState {
  return PHASE_REGULATION_MAP[phase].to
}
