/**
 * Intake routing resolution — compute gmFace + moveType from the player's
 * choice log and the master IntakeTemplate.
 *
 * DESIGN PRINCIPLES:
 *   • Routing is purely computed — no face labels on terminal passages.
 *   • sdWeights accumulate fractionally across all choices; argmax wins.
 *   • moveWeights accumulate similarly; fallback to direct moveType tag,
 *     then to 'growUp' when no signal is present.
 *   • This function is intentionally stateless and synchronous — it reads
 *     only from (choiceLog, template) and has no side effects.
 *   • completeIntakeSession() is the only caller that persists the result.
 *
 * See: src/lib/cyoa-intake/types.ts for the schema definitions.
 * See: src/actions/cyoa-intake.ts for IntakeChoiceLogEntry and
 *      resolveIntakeMoveType (simple tag-based fallback).
 */

import {
  type GmFaceKey,
  type IntakeMoveType,
  type IntakeTemplate,
  type IntakeTemplateChoice,
  type IntakeRoutingResult,
  SD_LADDER,
  INTAKE_MOVE_TYPES,
} from './types'

// ---------------------------------------------------------------------------
// Internal: build lookup maps from IntakeTemplate
// ---------------------------------------------------------------------------

/**
 * Build a map from choiceKey → IntakeTemplateChoice for fast lookup.
 * Used internally by resolveIntakeRouting.
 */
function buildChoiceKeyMap(template: IntakeTemplate): Map<string, IntakeTemplateChoice> {
  const map = new Map<string, IntakeTemplateChoice>()
  for (const passage of template.passages) {
    for (const choice of passage.choices) {
      if (choice.choiceKey) {
        map.set(choice.choiceKey, choice)
      }
    }
  }
  return map
}

/**
 * Build a map from (nodeId, targetId) → IntakeTemplateChoice as fallback
 * when choiceKey is not present in the log entry.
 * Key format: "{nodeId}::{targetId}"
 */
function buildNodeTargetMap(template: IntakeTemplate): Map<string, IntakeTemplateChoice> {
  const map = new Map<string, IntakeTemplateChoice>()
  for (const passage of template.passages) {
    for (const choice of passage.choices) {
      const key = `${passage.nodeId}::${choice.targetId}`
      map.set(key, choice)
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Log entry interface (matches IntakeChoiceLogEntry in cyoa-intake.ts)
// ---------------------------------------------------------------------------

/**
 * Minimal log entry shape consumed by resolveIntakeRouting.
 * Structurally compatible with IntakeChoiceLogEntry from cyoa-intake.ts.
 */
export interface ChoiceLogEntry {
  nodeId: string
  targetId: string
  choiceKey?: string
}

// ---------------------------------------------------------------------------
// Core resolution algorithm
// ---------------------------------------------------------------------------

/**
 * Resolve the intake routing result (gmFace + moveType) from the player's
 * accumulated choice log and the master IntakeTemplate.
 *
 * Algorithm:
 *   1. For each log entry, look up the corresponding IntakeTemplateChoice:
 *      - First try: match by `choiceKey` (preferred — stable identifier)
 *      - Fallback: match by (nodeId, targetId) pair
 *   2. Accumulate routing.sdWeights into faceScores
 *   3. Accumulate routing.moveWeights into moveScores (when present)
 *   4. gmFace = argmax(faceScores), defaulting to 'sage' on a tie
 *   5. moveType = argmax(moveScores) if any moveWeights were found;
 *      otherwise falls back to null (caller may apply tag-based fallback)
 *
 * @param choiceLog  The player's recorded choice sequence
 * @param template   The master IntakeTemplate from Adventure.playbookTemplate
 * @returns          Resolved routing result — gmFace, moveType, and raw scores
 */
export function resolveIntakeRouting(
  choiceLog: ChoiceLogEntry[],
  template: IntakeTemplate,
): IntakeRoutingResult {
  // Build lookup maps
  const byChoiceKey = buildChoiceKeyMap(template)
  const byNodeTarget = buildNodeTargetMap(template)

  // Initialize score accumulators
  const faceScores: Record<GmFaceKey, number> = {
    shaman: 0,
    challenger: 0,
    regent: 0,
    architect: 0,
    diplomat: 0,
    sage: 0,
  }
  const moveScores: Record<IntakeMoveType, number> = {
    wakeUp: 0,
    cleanUp: 0,
    growUp: 0,
    showUp: 0,
  }
  let anyMoveWeightsFound = false

  // Accumulate scores from each log entry
  for (const entry of choiceLog) {
    // Look up the template choice
    let templateChoice: IntakeTemplateChoice | undefined

    if (entry.choiceKey) {
      templateChoice = byChoiceKey.get(entry.choiceKey)
    }
    if (!templateChoice) {
      templateChoice = byNodeTarget.get(`${entry.nodeId}::${entry.targetId}`)
    }
    if (!templateChoice) continue

    const { routing } = templateChoice

    // Accumulate SD face weights
    for (const [face, weight] of Object.entries(routing.sdWeights)) {
      if (typeof weight === 'number' && weight > 0) {
        faceScores[face as GmFaceKey] = (faceScores[face as GmFaceKey] ?? 0) + weight
      }
    }

    // Accumulate move type weights (optional)
    if (routing.moveWeights) {
      for (const [move, weight] of Object.entries(routing.moveWeights)) {
        if (typeof weight === 'number' && weight > 0) {
          moveScores[move as IntakeMoveType] = (moveScores[move as IntakeMoveType] ?? 0) + weight
          anyMoveWeightsFound = true
        }
      }
    }
  }

  // Resolve gmFace via argmax — on tie, prefer the higher SD rung (more inclusive)
  const gmFace = resolveArgmaxFace(faceScores)

  // Resolve moveType via argmax when move weights were found
  const moveType: IntakeMoveType = anyMoveWeightsFound
    ? resolveArgmaxMove(moveScores)
    : 'growUp' // safe default when no move weights authored

  return { gmFace, moveType, faceScores, moveScores }
}

// ---------------------------------------------------------------------------
// Argmax helpers
// ---------------------------------------------------------------------------

/**
 * Argmax over faceScores.
 * On tie, prefers the higher SD rung (more developmental — richer routing target).
 * If all scores are 0, defaults to 'sage' (broadest container — least harmful default).
 */
function resolveArgmaxFace(faceScores: Record<GmFaceKey, number>): GmFaceKey {
  let bestFace: GmFaceKey = 'sage'
  let bestScore = -1

  // Iterate in SD_LADDER order so ties resolve toward higher rungs
  for (const face of SD_LADDER) {
    const score = faceScores[face] ?? 0
    if (score > bestScore) {
      bestScore = score
      bestFace = face
    }
  }

  return bestFace
}

/**
 * Argmax over moveScores.
 * On tie, prefers 'growUp' as the most generative default.
 */
function resolveArgmaxMove(moveScores: Record<IntakeMoveType, number>): IntakeMoveType {
  // Preference order for ties
  const MOVE_PREFERENCE: readonly IntakeMoveType[] = ['growUp', 'showUp', 'cleanUp', 'wakeUp']

  let bestMove: IntakeMoveType = 'growUp'
  let bestScore = -1

  for (const move of INTAKE_MOVE_TYPES) {
    const score = moveScores[move] ?? 0
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    } else if (score === bestScore) {
      // Tie-break: prefer earlier in MOVE_PREFERENCE
      const currentPref = MOVE_PREFERENCE.indexOf(bestMove)
      const candidatePref = MOVE_PREFERENCE.indexOf(move)
      if (candidatePref < currentPref) {
        bestMove = move
      }
    }
  }

  return bestMove
}

// ---------------------------------------------------------------------------
// Re-export types for callers who only import from this module
// ---------------------------------------------------------------------------

export type { GmFaceKey, IntakeMoveType, IntakeTemplate, IntakeRoutingResult }
