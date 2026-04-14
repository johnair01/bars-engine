/**
 * CYOA Composer — Face Recommendation Resolver
 *
 * Analyzes a player's completedBuilds history and returns weighted face
 * recommendations with priority scores. Used by the composer's face_selection
 * step to suggest which Game Master face the player should engage with next.
 *
 * Scoring philosophy:
 *   - Exploration bonus: faces the player has NOT yet tried score higher
 *   - Recency penalty: recently-used faces score lower (avoid monotony)
 *   - Emotional affinity: faces aligned with the player's current emotional
 *     vector get a relevance boost
 *   - Balance incentive: the system gently nudges toward all-6 coverage
 *     without forcing it (the player always has final choice)
 *
 * Pure function — no DB access, no side effects, fully testable.
 *
 * @see src/lib/campaign-hub/types.ts — CompletedBuildReceipt (input shape)
 * @see src/lib/quest-grammar/types.ts — GameMasterFace, EmotionalVector, FACE_META
 * @see src/lib/cyoa-composer/branch-visibility.ts — FACE_MOVE_AFFINITY (affinity data)
 */

import type { GameMasterFace, EmotionalVector, EmotionalChannel } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES, FACE_META } from '@/lib/quest-grammar/types'
import type { CompletedBuildReceipt } from '@/lib/campaign-hub/types'
import { FACE_MOVE_AFFINITY } from './branch-visibility'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single face recommendation with computed scores and reasoning.
 */
export interface FaceRecommendation {
  /** The recommended face. */
  face: GameMasterFace
  /** Display label from FACE_META. */
  label: string
  /** Composite priority score (0–1, higher = more recommended). */
  score: number
  /** Number of times this face has been used in completed builds. */
  timesUsed: number
  /** Whether this face has ever been used (convenience flag). */
  explored: boolean
  /** Human-readable reasoning for this recommendation (for UI tooltips). */
  reason: string
  /** Individual score components for debugging / transparency. */
  breakdown: ScoreBreakdown
}

/**
 * Decomposed score components — enables transparent "why this face?" UI
 * and makes testing precise.
 */
export interface ScoreBreakdown {
  /** Bonus for unexplored faces (0 or EXPLORATION_BONUS). */
  explorationBonus: number
  /** Penalty for recently-used faces (0 to -RECENCY_PENALTY). */
  recencyPenalty: number
  /** Bonus for emotional vector alignment (0 to EMOTIONAL_AFFINITY_BONUS). */
  emotionalAffinity: number
  /** Bonus for balance — incentive to cover all 6 faces (0 to BALANCE_BONUS). */
  balanceBonus: number
}

/**
 * Full output of the face recommendation resolver.
 */
export interface FaceRecommendationResult {
  /** All 6 faces with scores, sorted by score descending. */
  recommendations: FaceRecommendation[]
  /** The top recommendation (convenience accessor). */
  topRecommendation: FaceRecommendation
  /** How many of the 6 faces have been explored. */
  exploredCount: number
  /** Faces not yet explored. */
  unexploredFaces: GameMasterFace[]
  /** Total completed builds analyzed. */
  totalBuilds: number
}

// ---------------------------------------------------------------------------
// Scoring constants — tunable weights
// ---------------------------------------------------------------------------

/** Bonus for faces the player has never tried. */
export const EXPLORATION_BONUS = 0.35

/** Max penalty for the most recently used face. */
export const RECENCY_PENALTY = 0.25

/** Max bonus for emotional vector alignment. */
export const EMOTIONAL_AFFINITY_BONUS = 0.20

/** Max bonus for balance (approaching all-6 coverage). */
export const BALANCE_BONUS = 0.15

/** Base score: every face starts here before adjustments. */
export const BASE_SCORE = 0.50

// ---------------------------------------------------------------------------
// Emotional channel → face affinity mapping
// ---------------------------------------------------------------------------

/**
 * Which faces resonate most with each emotional channel.
 * Based on the Integral Theory / Wuxing model:
 *   - Fear → Shaman (threshold crossing) and Diplomat (relational safety)
 *   - Anger → Challenger (channeling intensity) and Regent (structural containment)
 *   - Sadness → Diplomat (care/connection) and Sage (integration)
 *   - Joy → Shaman (celebration/ritual) and Architect (creative strategy)
 *   - Neutrality → Sage (integration/emergence) and Architect (systematic clarity)
 */
export const CHANNEL_FACE_AFFINITY: Record<EmotionalChannel, GameMasterFace[]> = {
  Fear: ['shaman', 'diplomat'],
  Anger: ['challenger', 'regent'],
  Sadness: ['diplomat', 'sage'],
  Joy: ['shaman', 'architect'],
  Neutrality: ['sage', 'architect'],
}

// ---------------------------------------------------------------------------
// Core Resolver
// ---------------------------------------------------------------------------

/**
 * Analyze a player's completed builds and return face recommendations
 * with weighting/priority scores.
 *
 * @param completedBuilds — the player's build receipt history from CampaignHubStateV1
 * @param currentVector — the player's current emotional vector (from check-in or composer)
 * @param availableFaces — optional subset of faces to recommend from (e.g. campaign restrictions)
 * @returns Scored and sorted face recommendations
 *
 * @example
 * ```ts
 * const result = resolveFaceRecommendations(
 *   hubState.completedBuilds,
 *   { channelFrom: 'Fear', altitudeFrom: 'dissatisfied', channelTo: 'Fear', altitudeTo: 'neutral' },
 * )
 * console.log(result.topRecommendation.face) // e.g. 'shaman'
 * console.log(result.unexploredFaces)        // e.g. ['architect', 'diplomat']
 * ```
 */
export function resolveFaceRecommendations(
  completedBuilds: CompletedBuildReceipt[],
  currentVector?: EmotionalVector | null,
  availableFaces?: GameMasterFace[],
): FaceRecommendationResult {
  const faces = availableFaces ?? [...GAME_MASTER_FACES]
  const totalBuilds = completedBuilds.length

  // ── Build usage stats ────────────────────────────────────────────────
  const usageCount = new Map<GameMasterFace, number>()
  const lastUsedIndex = new Map<GameMasterFace, number>()

  for (const face of GAME_MASTER_FACES) {
    usageCount.set(face, 0)
  }

  for (let i = 0; i < completedBuilds.length; i++) {
    const build = completedBuilds[i]
    const face = build.face as GameMasterFace
    if (GAME_MASTER_FACES.includes(face)) {
      usageCount.set(face, (usageCount.get(face) ?? 0) + 1)
      lastUsedIndex.set(face, i)
    }
  }

  const exploredFaces = new Set(
    GAME_MASTER_FACES.filter((f) => (usageCount.get(f) ?? 0) > 0),
  )

  // ── Score each face ──────────────────────────────────────────────────
  const recommendations: FaceRecommendation[] = faces.map((face) => {
    const timesUsed = usageCount.get(face) ?? 0
    const explored = timesUsed > 0

    const breakdown = computeScoreBreakdown(
      face,
      timesUsed,
      explored,
      lastUsedIndex.get(face),
      totalBuilds,
      exploredFaces.size,
      currentVector,
    )

    const rawScore =
      BASE_SCORE +
      breakdown.explorationBonus +
      breakdown.recencyPenalty +
      breakdown.emotionalAffinity +
      breakdown.balanceBonus

    // Clamp to [0, 1]
    const score = Math.max(0, Math.min(1, rawScore))

    const reason = buildReason(face, explored, breakdown, currentVector)

    return {
      face,
      label: FACE_META[face].label,
      score,
      timesUsed,
      explored,
      reason,
      breakdown,
    }
  })

  // ── Sort by score descending, then alphabetical as tiebreaker ───────
  recommendations.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.face.localeCompare(b.face)
  })

  const unexploredFaces = GAME_MASTER_FACES.filter(
    (f) => !exploredFaces.has(f) && faces.includes(f),
  )

  return {
    recommendations,
    topRecommendation: recommendations[0],
    exploredCount: exploredFaces.size,
    unexploredFaces,
    totalBuilds,
  }
}

// ---------------------------------------------------------------------------
// Score Breakdown Computation
// ---------------------------------------------------------------------------

function computeScoreBreakdown(
  face: GameMasterFace,
  timesUsed: number,
  explored: boolean,
  lastUsedIdx: number | undefined,
  totalBuilds: number,
  exploredCount: number,
  currentVector?: EmotionalVector | null,
): ScoreBreakdown {
  // ── Exploration bonus: full bonus for unexplored faces ───────────────
  const explorationBonus = explored ? 0 : EXPLORATION_BONUS

  // ── Recency penalty: more recent usage = higher penalty ──────────────
  // Linear decay: penalty is max when lastUsedIdx === totalBuilds - 1 (most recent)
  // and 0 when far in the past (or never used)
  let recencyPenalty = 0
  if (explored && lastUsedIdx !== undefined && totalBuilds > 0) {
    // How recent? 1.0 = most recent build, 0.0 = oldest build
    const recencyRatio = (lastUsedIdx + 1) / totalBuilds
    recencyPenalty = -(recencyRatio * RECENCY_PENALTY)
  }

  // ── Emotional affinity: bonus if face matches current channel ────────
  let emotionalAffinity = 0
  if (currentVector) {
    const channel = currentVector.channelFrom
    const affineFaces = CHANNEL_FACE_AFFINITY[channel]
    if (affineFaces?.includes(face)) {
      // Primary affinity (first in list) gets full bonus; secondary gets half
      const isPrimary = affineFaces[0] === face
      emotionalAffinity = isPrimary
        ? EMOTIONAL_AFFINITY_BONUS
        : EMOTIONAL_AFFINITY_BONUS * 0.5
    }
  }

  // ── Balance bonus: reward faces that fill coverage gaps ──────────────
  // The fewer faces explored, the higher the bonus for unexplored faces.
  // When all 6 are explored, balance bonus is 0 for everyone.
  let balanceBonus = 0
  if (!explored && exploredCount < 6) {
    // Scale: max bonus when few faces explored, diminishes as coverage grows
    const coverageGap = (6 - exploredCount) / 6
    balanceBonus = coverageGap * BALANCE_BONUS
  }

  return {
    explorationBonus,
    recencyPenalty,
    emotionalAffinity,
    balanceBonus,
  }
}

// ---------------------------------------------------------------------------
// Human-readable reason builder
// ---------------------------------------------------------------------------

function buildReason(
  face: GameMasterFace,
  explored: boolean,
  breakdown: ScoreBreakdown,
  currentVector?: EmotionalVector | null,
): string {
  const parts: string[] = []
  const meta = FACE_META[face]

  if (!explored) {
    parts.push(`You haven't explored the ${meta.label} yet — ${meta.mission}`)
  }

  if (breakdown.emotionalAffinity > 0 && currentVector) {
    const channel = currentVector.channelFrom
    parts.push(`The ${meta.label} resonates with your current ${channel} energy`)
  }

  if (breakdown.recencyPenalty < -RECENCY_PENALTY * 0.5) {
    parts.push(`You recently worked with the ${meta.label} — try branching out`)
  }

  if (breakdown.balanceBonus > 0) {
    parts.push('Exploring new faces deepens your developmental range')
  }

  if (parts.length === 0) {
    parts.push(`The ${meta.label}: ${meta.mission}`)
  }

  return parts.join('. ')
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/**
 * Get the top N face recommendations.
 * Useful for compact UI elements that show 2–3 suggestions.
 */
export function getTopFaceRecommendations(
  result: FaceRecommendationResult,
  count: number = 3,
): FaceRecommendation[] {
  return result.recommendations.slice(0, count)
}

/**
 * Check if a specific face is the top recommendation.
 */
export function isTopRecommendedFace(
  result: FaceRecommendationResult,
  face: GameMasterFace,
): boolean {
  return result.topRecommendation.face === face
}

/**
 * Get the recommendation for a specific face.
 * Returns undefined if the face is not in the available set.
 */
export function getRecommendationForFace(
  result: FaceRecommendationResult,
  face: GameMasterFace,
): FaceRecommendation | undefined {
  return result.recommendations.find((r) => r.face === face)
}

/**
 * Compute face exploration progress as a percentage (0–100).
 * Useful for gamification UI ("You've explored 4 of 6 faces!").
 */
export function getFaceExplorationProgress(
  result: FaceRecommendationResult,
): number {
  return Math.round((result.exploredCount / 6) * 100)
}
