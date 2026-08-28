/**
 * I Ching → Game Master Faces for lens choice.
 *
 * Derives available faces from hexagram trigrams.
 * No db/Prisma — safe for client bundle.
 * See .specify/specs/onboarding-quest-generation-unblock/spec.md Phase 3.
 */

import { isLineCorrect, FACE_LINE } from '@/lib/iching-struct'
import type { GameMasterFace } from './types'

const ALL_FACES: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

/**
 * Derive available Game Master faces for a hexagram.
 *
 * A face is available when its line sits in its correct place, so the figure
 * supports that seat. `FACE_LINE` in `lib/iching-struct.ts` holds the positions.
 *
 * Corrected 2026-08-27. This used a face-to-trigram table that put six faces on
 * six of the eight trigrams and left Water and Thunder with none — the collapse
 * the 2026-08-23 ruling names. A face has an expression at every trigram, so
 * matching on trigram identity narrowed the choice on a relationship that does
 * not exist. It also narrowed too hard: an average of 1.78 faces per figure,
 * with four figures matching nothing and falling through to all six. The line
 * rule gives 3.09 on average, and only hexagram 64 falls through — every line
 * out of place, which is what that figure is.
 */
export function getFacesForHexagram(hexagramId: number): GameMasterFace[] {
  const available = ALL_FACES.filter((face) => isLineCorrect(hexagramId, FACE_LINE[face]))
  return available.length > 0 ? [...available] : [...ALL_FACES]
}
