/**
 * GM Face Modifiers — per-face modulation metadata for encounter/scene generation.
 * @see .specify/specs/gm-face-modifiers/spec.md
 */

import { db } from '@/lib/db'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { GmFaceModifier } from '@prisma/client'

export type { GmFaceModifier }

/**
 * Fetch modulation metadata for a Game Master face.
 * Returns null if not seeded.
 */
export async function getGmFaceModifier(face: GameMasterFace): Promise<GmFaceModifier | null> {
  return db.gmFaceModifier.findUnique({
    where: { face },
  })
}
