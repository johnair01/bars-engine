/**
 * Face Exploration Scoring — analyzes completedBuilds history
 *
 * Calculates how many times each GameMasterFace has been explored
 * across completed builds and returns ranked under-explored faces.
 *
 * Used by:
 *   - CYOA Composer adaptive step ordering (suggest under-explored faces)
 *   - Sage NPC effectiveFace computation (least-explored recommendation)
 *   - Hub return-witness display (exploration breadth indicator)
 *
 * Design:
 *   - Pure functions, no side effects, fully testable
 *   - Operates on CampaignHubStateV1 or CompletedBuildReceipt[] directly
 *   - Sage face is excluded from exploration scoring (meta-face, never a build target)
 *
 * @see src/lib/campaign-hub/types.ts — CampaignHubStateV1, CompletedBuildReceipt
 * @see src/lib/quest-grammar/types.ts — GameMasterFace, GAME_MASTER_FACES
 * @see src/lib/npc-face-resolver.ts — findLeastExploredFace (internal, simpler version)
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'
import type { CampaignHubStateV1, CompletedBuildReceipt } from './types'
import { getCompletedBuilds } from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The 5 explorable faces (excludes Sage — meta-face, never a build target).
 * Sage integrates all faces and is never directly selected in the composer.
 */
export const EXPLORABLE_FACES: readonly GameMasterFace[] = [
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
] as const

/** Total number of explorable faces (for normalization). */
export const EXPLORABLE_FACE_COUNT = EXPLORABLE_FACES.length

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/**
 * Exploration score for a single face.
 */
export type FaceExplorationScore = {
  /** The Game Master face. */
  face: GameMasterFace
  /** Number of completed builds using this face. */
  count: number
  /** Proportion of total builds (0–1). 0 if no builds completed. */
  ratio: number
}

/**
 * Full exploration analysis result.
 */
export type FaceExplorationAnalysis = {
  /** Per-face scores, ranked by count ascending (least explored first). */
  ranked: FaceExplorationScore[]
  /** Total number of completed builds analyzed. */
  totalBuilds: number
  /** Number of distinct faces explored (0–5). */
  distinctFacesExplored: number
  /** Faces never explored (count === 0), ordered by canonical face order. */
  unexplored: GameMasterFace[]
  /**
   * Exploration breadth ratio (0–1).
   * distinctFacesExplored / EXPLORABLE_FACE_COUNT.
   * 1.0 means all 5 faces have been explored at least once.
   */
  breadth: number
}

// ---------------------------------------------------------------------------
// Core scoring
// ---------------------------------------------------------------------------

/**
 * Count explorations per face from a list of completed build receipts.
 *
 * @param receipts — completed build receipts (from hub ledger)
 * @returns Map of face → count (only explorable faces, excludes Sage)
 */
export function countFaceExplorations(
  receipts: readonly CompletedBuildReceipt[],
): Map<GameMasterFace, number> {
  const counts = new Map<GameMasterFace, number>()

  // Initialize all explorable faces to 0
  for (const face of EXPLORABLE_FACES) {
    counts.set(face, 0)
  }

  // Tally receipts
  for (const receipt of receipts) {
    const face = receipt.face
    // Skip sage builds (defensive — sage shouldn't appear as a build face)
    if (face === 'sage') continue
    if (counts.has(face)) {
      counts.set(face, counts.get(face)! + 1)
    }
  }

  return counts
}

/**
 * Analyze face exploration from completed build receipts.
 *
 * Returns a full analysis with per-face scores ranked by ascending count
 * (least explored first), total builds, breadth ratio, and unexplored faces.
 *
 * @param receipts — completed build receipts (from hub state or direct query)
 * @returns FaceExplorationAnalysis with ranked scores and summary metrics
 */
export function analyzeFaceExploration(
  receipts: readonly CompletedBuildReceipt[],
): FaceExplorationAnalysis {
  const counts = countFaceExplorations(receipts)
  const totalBuilds = receipts.filter((r) => r.face !== 'sage').length

  // Build scored entries
  const scored: FaceExplorationScore[] = EXPLORABLE_FACES.map((face) => {
    const count = counts.get(face) ?? 0
    return {
      face,
      count,
      ratio: totalBuilds > 0 ? count / totalBuilds : 0,
    }
  })

  // Sort by count ascending (least explored first).
  // Tie-break: canonical face order (stable sort preserves insertion order).
  scored.sort((a, b) => a.count - b.count)

  const unexplored = scored.filter((s) => s.count === 0).map((s) => s.face)
  const distinctFacesExplored = EXPLORABLE_FACE_COUNT - unexplored.length

  return {
    ranked: scored,
    totalBuilds,
    distinctFacesExplored,
    unexplored,
    breadth: distinctFacesExplored / EXPLORABLE_FACE_COUNT,
  }
}

/**
 * Analyze face exploration directly from hub state.
 * Convenience wrapper that extracts completedBuilds from CampaignHubStateV1.
 *
 * @param hubState — the campaign hub state (or null/undefined for empty analysis)
 * @returns FaceExplorationAnalysis
 */
export function analyzeFaceExplorationFromHub(
  hubState: CampaignHubStateV1 | null | undefined,
): FaceExplorationAnalysis {
  if (!hubState) {
    return analyzeFaceExploration([])
  }
  return analyzeFaceExploration(getCompletedBuilds(hubState))
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Get the single least-explored face from completed builds.
 * If multiple faces are tied for the minimum count, returns the first
 * in canonical face order (shaman > challenger > regent > architect > diplomat).
 *
 * Returns null only if all 5 faces are equally explored (including 0 each).
 *
 * @param receipts — completed build receipts
 * @returns The least-explored face, or null if all are equally explored
 */
export function getLeastExploredFace(
  receipts: readonly CompletedBuildReceipt[],
): GameMasterFace | null {
  const counts = countFaceExplorations(receipts)

  let minCount = Infinity
  let minFace: GameMasterFace | null = null
  let allEqual = true
  let firstCount: number | null = null

  for (const face of EXPLORABLE_FACES) {
    const count = counts.get(face) ?? 0
    if (firstCount === null) {
      firstCount = count
    } else if (count !== firstCount) {
      allEqual = false
    }
    if (count < minCount) {
      minCount = count
      minFace = face
    }
  }

  // If all faces have the same count, there's no under-explored face
  if (allEqual) return null

  return minFace
}

/**
 * Get the top N under-explored faces, ranked by ascending exploration count.
 *
 * @param receipts — completed build receipts
 * @param n — number of faces to return (default: 3)
 * @returns Array of up to N FaceExplorationScore entries, least explored first
 */
export function getUnderExploredFaces(
  receipts: readonly CompletedBuildReceipt[],
  n = 3,
): FaceExplorationScore[] {
  const analysis = analyzeFaceExploration(receipts)
  return analysis.ranked.slice(0, Math.min(n, EXPLORABLE_FACE_COUNT))
}

/**
 * Check if a specific face has been explored at least once.
 *
 * @param receipts — completed build receipts
 * @param face — face to check
 * @returns true if the face appears in at least one completed build
 */
export function isFaceExplored(
  receipts: readonly CompletedBuildReceipt[],
  face: GameMasterFace,
): boolean {
  if (face === 'sage') return false // Sage is never "explored" as a build face
  return receipts.some((r) => r.face === face)
}

/**
 * Get a face suggestion for the composer based on exploration history.
 * Returns the single best suggestion — the least explored face that
 * isn't the same as the current spoke face (to encourage diversity).
 *
 * @param receipts — completed build receipts
 * @param currentSpokeFace — the face assigned to the current spoke (excluded from suggestion)
 * @returns Suggested face, or null if no meaningful suggestion
 */
export function suggestFaceForComposer(
  receipts: readonly CompletedBuildReceipt[],
  currentSpokeFace?: GameMasterFace | null,
): GameMasterFace | null {
  const analysis = analyzeFaceExploration(receipts)

  // Filter out the current spoke face and sage
  const candidates = analysis.ranked.filter(
    (s) => s.face !== currentSpokeFace && s.face !== 'sage',
  )

  if (candidates.length === 0) return null

  // Return the least explored candidate
  return candidates[0]!.face
}
