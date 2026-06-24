/**
 * Assembled superpower decks (one 60-card pack per superpower).
 * Spec: .specify/specs/superpower-move-decks/spec.md
 *
 * Kept separate from `index.ts` to avoid an import cycle with `pools.ts`.
 * These are expansion packs — NEVER merged into the base CANONICAL_TECHNIQUES.
 */

import { SUPERPOWERS, type Superpower } from '../vocabulary'
import type { Technique } from '../types'
import { SUPERPOWER_PROFILES } from './profiles'
import { buildSuperpowerDeck } from './grid'
import { SUPERPOWER_OVERRIDES } from './overrides'

/** Replace any generated cell with its hand-authored hero override (by id). */
function applyOverrides(cards: Technique[]): Technique[] {
  return cards.map((c) => SUPERPOWER_OVERRIDES[c.id] ?? c)
}

export const SUPERPOWER_DECKS: Record<Superpower, Technique[]> = Object.fromEntries(
  SUPERPOWERS.map((sp) => [sp, applyOverrides(buildSuperpowerDeck(SUPERPOWER_PROFILES[sp]))]),
) as Record<Superpower, Technique[]>

/** Every card in a superpower's deck (any status). */
export function superpowerDeck(sp: Superpower): Technique[] {
  return SUPERPOWER_DECKS[sp]
}

/** Only the published cards — what an owner's pool actually receives. */
export function publishedDeck(sp: Superpower): Technique[] {
  return SUPERPOWER_DECKS[sp].filter((t) => t.status === 'published')
}
