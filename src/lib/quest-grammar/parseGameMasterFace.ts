import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'

const FACE_SET = new Set<string>(GAME_MASTER_FACES)

/**
 * Normalize a URL or Twine-supplied face string to a canonical Game Master face.
 * Invalid or empty input returns null — callers must not persist garbage (issue #36 / CYOA spec).
 */
export function parseGameMasterFace(input: string | null | undefined): GameMasterFace | null {
  if (input == null) return null
  const k = String(input).trim().toLowerCase()
  if (!k) return null
  return FACE_SET.has(k) ? (k as GameMasterFace) : null
}
