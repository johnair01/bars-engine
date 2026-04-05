import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'

const FACE_SET = new Set<string>(GAME_MASTER_FACES)

export type ChunkTagInput = {
  charStart: number
  charEnd: number
  gameMasterFace: GameMasterFace
  hexagramId?: number | null
  metadata?: Record<string, unknown> | null
}

export function isValidGameMasterFace(s: string): s is GameMasterFace {
  return FACE_SET.has(s)
}

export function validateHexagramId(n: unknown): n is number | null | undefined {
  if (n === undefined || n === null) return true
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 64
}

/** Max tags per PUT (full replace). */
export const BOOK_CHUNK_TAGS_MAX_PER_REQUEST = 2000

export function validateChunkTagRow(
  row: unknown,
  index: number
): { ok: true; value: ChunkTagInput } | { ok: false; error: string } {
  if (!row || typeof row !== 'object') {
    return { ok: false, error: `tags[${index}]: expected object` }
  }
  const o = row as Record<string, unknown>
  const charStart = o.charStart
  const charEnd = o.charEnd
  const face = o.gameMasterFace

  if (typeof charStart !== 'number' || !Number.isInteger(charStart) || charStart < 0) {
    return { ok: false, error: `tags[${index}]: charStart must be a non-negative integer` }
  }
  if (typeof charEnd !== 'number' || !Number.isInteger(charEnd) || charEnd < 0) {
    return { ok: false, error: `tags[${index}]: charEnd must be a non-negative integer` }
  }
  if (charStart > charEnd) {
    return { ok: false, error: `tags[${index}]: charStart must be <= charEnd` }
  }
  if (typeof face !== 'string' || !isValidGameMasterFace(face)) {
    return {
      ok: false,
      error: `tags[${index}]: gameMasterFace must be one of: ${GAME_MASTER_FACES.join(', ')}`,
    }
  }

  const hex = o.hexagramId
  if (!validateHexagramId(hex)) {
    return { ok: false, error: `tags[${index}]: hexagramId must be 1–64 or null` }
  }

  let metadata: Record<string, unknown> | null = null
  if (o.metadata != null) {
    if (typeof o.metadata !== 'object' || Array.isArray(o.metadata)) {
      return { ok: false, error: `tags[${index}]: metadata must be an object` }
    }
    metadata = o.metadata as Record<string, unknown>
  }

  return {
    ok: true,
    value: {
      charStart,
      charEnd,
      gameMasterFace: face,
      hexagramId: hex === undefined ? undefined : hex,
      metadata,
    },
  }
}
