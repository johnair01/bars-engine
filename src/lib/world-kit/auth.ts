/**
 * Author identity for the world-kit publish path (ruling 2026-11-23: a long-lived token in the Authorization header,
 * stored outside the kit; no login flow). WORLD_KIT_TOKENS is an admin-issued JSON map of token -> player id.
 */
import { timingSafeEqual } from 'node:crypto'

function readMap(): Record<string, string> {
  try {
    const parsed = JSON.parse(process.env.WORLD_KIT_TOKENS || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function configured(): boolean {
  return Object.keys(readMap()).length > 0
}

/** The player id the bearer token maps to, or null. Compared in constant time. */
export function playerForToken(authorization: string | null): string | null {
  const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!bearer) return null
  const given = Buffer.from(bearer)
  for (const [token, playerId] of Object.entries(readMap())) {
    const want = Buffer.from(token)
    if (want.length === given.length && timingSafeEqual(want, given) && typeof playerId === 'string' && playerId) return playerId
  }
  return null
}
