/**
 * I Ching → Game Master Faces for lens choice.
 *
 * Derives available faces from hexagram trigrams.
 * No db/Prisma — safe for client bundle.
 * See .specify/specs/onboarding-quest-generation-unblock/spec.md Phase 3.
 */

import { getHexagramStructure, type Trigram } from '@/lib/iching-struct'
import type { GameMasterFace } from './types'

/** Face → preferred trigram (Game Master sect alignment). */
const FACE_TRIGRAM: Record<GameMasterFace, string> = {
  shaman: 'Earth',
  challenger: 'Fire',
  regent: 'Lake',
  architect: 'Heaven',
  diplomat: 'Wind',
  sage: 'Mountain',
}

const ALL_FACES: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

/**
 * Derive available Game Master faces for a hexagram.
 * Faces whose preferred trigram matches the hexagram's upper or lower trigram are "available."
 * When none match, returns all 6 faces.
 */
export function getFacesForHexagram(hexagramId: number): GameMasterFace[] {
  const structure = getHexagramStructure(hexagramId)
  const trigrams = [structure.upper, structure.lower]
  const available = ALL_FACES.filter((face) => {
    const preferred = FACE_TRIGRAM[face]
    return preferred && trigrams.includes(preferred as Trigram)
  })
  return available.length > 0 ? [...available] : [...ALL_FACES]
}
