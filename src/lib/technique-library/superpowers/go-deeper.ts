/**
 * Go Deeper — the pure decision core.
 * Spec: .specify/specs/go-deeper/spec.md (Slice 4)
 *
 * Given a base card + the player's loadout + which subject it's read in + which
 * packs they own, decide what the "Go Deeper" affordance shows:
 *   - ok          → they own the active-slot pack and a publishable move exists
 *   - locked      → a publishable move exists, but they don't own the pack (upsell)
 *   - unavailable → no published move at this coordinate (hide the affordance)
 *
 * Deterministic, no I/O. Player-presence states (needs_login / needs_quiz) are
 * decided one layer up, in the server action.
 */

import type { MoveCard, Subject } from '@/lib/allyship-deck/types'
import type { Technique } from '../types'
import type { Superpower, Loadout, MoveAspect } from '../vocabulary'
import { assessQuality } from '../quality'
import { aspectForSubject } from '../resolve'
import { superpowerDeck } from './decks'
import { superpowerCardId } from './grid'
import { citeSuperpowerMove, type SuperpowerCitation } from './pools'

export type GoDeeperState = 'ok' | 'locked' | 'unavailable'

export interface GoDeeperResult {
  state: GoDeeperState
  superpower: Superpower
  aspect: MoveAspect
  /** A publishable (L3+) move exists at this coordinate. */
  available: boolean
  owned: boolean
  /** The full move — only when owned AND available. */
  technique: Technique | null
  /** Coordinate + owned flag; never leaks content when locked. */
  citation: SuperpowerCitation
  /** The superpower whose pack to upsell — only when locked. */
  upsellSuperpower: Superpower | null
}

/** Is this superpower card good enough to surface (published, L3+)? */
function isSurfaceable(card: Technique | undefined): card is Technique {
  return !!card && card.status === 'published' && assessQuality(card).level >= 3
}

export function buildGoDeeper(
  card: Pick<MoveCard, 'move' | 'operation'>,
  loadout: Loadout,
  subject: Subject,
  owned: readonly Superpower[],
): GoDeeperResult {
  const aspect = aspectForSubject(subject)
  const superpower = loadout[aspect]
  const citation = citeSuperpowerMove(card, loadout, subject, owned)

  const spCard = superpowerDeck(superpower).find(
    (c) => c.id === superpowerCardId(superpower, card.move, card.operation, aspect),
  )
  const available = isSurfaceable(spCard)
  const owns = owned.includes(superpower)

  if (!available) {
    return { state: 'unavailable', superpower, aspect, available: false, owned: owns, technique: null, citation, upsellSuperpower: null }
  }
  if (owns) {
    return { state: 'ok', superpower, aspect, available: true, owned: true, technique: spCard, citation, upsellSuperpower: null }
  }
  return { state: 'locked', superpower, aspect, available: true, owned: false, technique: null, citation, upsellSuperpower: superpower }
}
