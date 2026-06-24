/**
 * Pool composition + citation for superpower expansion packs.
 * Spec: .specify/specs/superpower-move-decks/spec.md
 *
 * The base pool stays base-only. An owner composes `base + owned packs` at call
 * time. Citation is pure coordinate math (the full grid guarantees a card exists
 * at every move × level × aspect), so the base experience can point to a
 * superpower move and invite acquisition without revealing gated content.
 */

import type { MoveCard, Subject } from '@/lib/allyship-deck/types'
import type { Technique } from '../types'
import type { Superpower, Loadout, MoveAspect } from '../vocabulary'
import { aspectForSubject } from '../resolve'
import { superpowerDeck, publishedDeck } from './decks'
import { MOVE_ABBR } from './grid'

export interface PoolOptions {
  /** Include unpublished (draft) pack cards — for tooling/preview only. Default false. */
  includeDrafts?: boolean
}

/**
 * Compose a resolution pool: the base pool plus the published cards of any owned
 * superpower decks. Unowned packs are never included.
 */
export function poolWithSuperpowers(
  base: readonly Technique[],
  owned: readonly Superpower[],
  opts: PoolOptions = {},
): Technique[] {
  const pick = opts.includeDrafts ? superpowerDeck : publishedDeck
  return [...base, ...owned.flatMap((sp) => pick(sp))]
}

export interface SuperpowerCitation {
  superpower: Superpower
  move: MoveCard['move']
  operation: MoveCard['operation']
  aspect: MoveAspect
  /** Whether the player owns this superpower's deck (gates content, not existence). */
  owned: boolean
  /** Deterministic id of the pack card that applies here. */
  cardId: string
}

/**
 * For a base card + loadout + subject, name the superpower card that applies at
 * this coordinate. Always resolvable (full grid); returns coordinates + owned
 * flag only — never the gated content.
 */
export function citeSuperpowerMove(
  card: Pick<MoveCard, 'move' | 'operation'>,
  loadout: Loadout,
  subject: Subject,
  owned: readonly Superpower[],
): SuperpowerCitation {
  const aspect = aspectForSubject(subject)
  const superpower = loadout[aspect]
  return {
    superpower,
    move: card.move,
    operation: card.operation,
    aspect,
    owned: owned.includes(superpower),
    cardId: `sp-${superpower}-${MOVE_ABBR[card.move]}-${card.operation.toUpperCase()}-${aspect.toUpperCase()}`,
  }
}
