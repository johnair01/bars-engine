/**
 * Deck sampling — pick a small, representative teaser from the full move deck.
 *
 * Used by the public `/deck/preview` gallery so visitors see a taste of the deck
 * (not all 120 cards — that's the paid product). Deterministic: no randomness, so
 * the sample is stable across renders/builds and is the single source of truth.
 */

import type { AllyshipDomain, BasicMove, MoveCard, Operation } from './types'

/** Fixed walk orders (match the type unions) used to spread the sample. */
const MOVE_ORDER: BasicMove[] = ['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up']
const DOMAIN_ORDER: AllyshipDomain[] = [
  'GATHERING_RESOURCES',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
  'SKILLFUL_ORGANIZING',
]
const OPERATION_ORDER: Operation[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

const tripleKey = (move: BasicMove, domain: AllyshipDomain, op: Operation) => `${move}|${domain}|${op}`

/**
 * Pick a representative sample of move cards. Walks a diagonal across
 * move × domain × face (each index advances all three on their own cycle), so the
 * sample spreads over every move, every domain, and every face rather than
 * clustering — the deck's `num` ordering is domain-major, so a naive slice would
 * show one domain only. Deterministic; returns up to `count` distinct cards, with
 * a stable fallback if the deck isn't a complete 5 × 4 × 6 grid.
 */
export function pickDeckSample(cards: MoveCard[], count = 12): MoveCard[] {
  const byTriple = new Map<string, MoveCard>()
  for (const c of cards) byTriple.set(tripleKey(c.move, c.domain, c.operation), c)

  // Stable fallback pool: grouped by move, each sorted by `num`.
  const byMove = new Map<BasicMove, MoveCard[]>(MOVE_ORDER.map((m) => [m, []]))
  for (const c of cards) byMove.get(c.move)?.push(c)
  for (const list of byMove.values()) list.sort((a, b) => a.num.localeCompare(b.num))

  const used = new Set<string>()
  const out: MoveCard[] = []
  const target = Math.min(count, cards.length)

  for (let i = 0; out.length < target && i < cards.length * 2; i++) {
    const move = MOVE_ORDER[i % MOVE_ORDER.length]
    const domain = DOMAIN_ORDER[i % DOMAIN_ORDER.length]
    const op = OPERATION_ORDER[i % OPERATION_ORDER.length]

    let card = byTriple.get(tripleKey(move, domain, op))
    if (!card || used.has(card.id)) {
      // Fallback: first still-unused card for this move (keeps move coverage).
      card = byMove.get(move)?.find((c) => !used.has(c.id))
    }
    if (card && !used.has(card.id)) {
      used.add(card.id)
      out.push(card)
    }
  }
  return out
}
