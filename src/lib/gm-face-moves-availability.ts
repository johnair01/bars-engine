/**
 * Which GM face × stage moves are available for strict lockstep (current Kotter stage only).
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md §D
 */

import {
  getGmFaceStageMovesForStage,
  type GmFaceStageMove,
} from '@/lib/gm-face-stage-moves'

function clampKotterStage(n: number): number {
  return Math.max(1, Math.min(8, Math.round(n)))
}

/**
 * Moves available for this campaign clock (v1: **current stage only** — no backlog of prior stages in picker).
 */
export function getAvailableFaceMovesForStage(kotterStage: number): readonly GmFaceStageMove[] {
  return getGmFaceStageMovesForStage(clampKotterStage(kotterStage))
}

export type { GmFaceStageMove }
