/**
 * Resolve canonical emotional move from context (domain + lens).
 * Used by starter quest generator and other systems that need move resolution
 * without hardcoding emotional logic in quest definitions.
 *
 * See: .agent/context/emotional-alchemy-interfaces.md §4 Domain (WHERE) ↔ Moves
 * See: .specify/specs/starter-quest-generator/spec.md
 */

import type { CanonicalMove } from './move-engine'
import { ALL_CANONICAL_MOVES } from './move-engine'
import { getMovesForLens } from './lens-moves'

/** Domain → preferred move IDs (from emotional-alchemy-interfaces: Water/Wood/Earth etc.) */
const DOMAIN_MOVE_IDS: Record<string, string[]> = {
  GATHERING_RESOURCES: ['water_wood', 'earth_water', 'wood_fire'], // Water, Wood, Earth
  SKILLFUL_ORGANIZING: ['earth_metal', 'wood_earth', 'metal_water'], // Earth, Metal, Wood
  RAISE_AWARENESS: ['metal_water', 'water_wood', 'fire_earth'], // Metal, Fire, Water
  DIRECT_ACTION: ['wood_fire', 'fire_transcend', 'fire_earth'], // Fire, Wood
}

/** Valid lens keys for getMovesForLens (GM faces) */
const LENS_KEYS = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const

export interface ResolveMoveForContextParams {
  allyshipDomain: string
  lens?: string
  campaignPhase?: number
}

/**
 * Resolve canonical move from domain + optional lens.
 * When lens present and is a GM face, intersects domain preference with lens moves.
 * Otherwise returns first move from domain preference.
 */
export function resolveMoveForContext(params: ResolveMoveForContextParams): CanonicalMove | null {
  const { allyshipDomain, lens } = params
  const domain = allyshipDomain.toUpperCase()
  const domainMoveIds = DOMAIN_MOVE_IDS[domain]
  if (!domainMoveIds) return null

  const domainMoves = domainMoveIds
    .map((id) => ALL_CANONICAL_MOVES.find((m) => m.id === id))
    .filter((m): m is CanonicalMove => m != null)
  if (domainMoves.length === 0) return null

  if (lens && typeof lens === 'string') {
    const lensKey = lens.toLowerCase()
    if ((LENS_KEYS as readonly string[]).includes(lensKey)) {
      const lensMoves = getMovesForLens(lens)
      const lensIds = new Set(lensMoves.map((m) => m.id))
      const intersection = domainMoves.find((m) => lensIds.has(m.id))
      if (intersection) return intersection
    }
  }

  return domainMoves[0]
}
