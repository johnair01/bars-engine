/**
 * Emotional Alchemy — Allyship-Deck draw (closes gap G13).
 * Spec: .specify/specs/emotional-alchemy-practice-card/spec.md
 *
 * The drawn Allyship card fixes the composer's WAVE submove + domain + the
 * canonical stance question (the card's introspective question). Replaces the
 * interim submove picker. Pure + DB-free: the 120 cards are assembled in code
 * (deck precedent) and drawn client-side, exactly as AllyshipDeckReader does.
 */

import { assembleDeck } from '@/lib/allyship-deck/assemble'
import { DOMAIN_LABELS } from '@/lib/allyship-deck/card-visuals'
import type { MoveCard } from '@/lib/allyship-deck/types'
import type { ComposerCard } from './composer'

let CACHE: MoveCard[] | null = null

/** All 120 move cards (assembled once, in code — no DB, no JSON fetch). */
export function allMoveCards(): MoveCard[] {
  if (!CACHE) {
    // Fixed generatedAt string → no Date() (stable, hydration-safe).
    CACHE = assembleDeck('emotional-alchemy-draw').cards.filter((c): c is MoveCard => c.kind === 'move')
  }
  return CACHE
}

/** Draw one move card at random, optionally excluding the previously drawn id (redraw). */
export function drawMoveCard(rng: () => number = Math.random, excludeId?: string): MoveCard {
  const cards = allMoveCards()
  const pool = excludeId ? cards.filter((c) => c.id !== excludeId) : cards
  return pool[Math.floor(rng() * pool.length)]
}

/** The drawn card fixes the composer's submove, stance question, and domain. */
export function composerCardFromMoveCard(card: MoveCard): ComposerCard {
  return {
    submove: card.move,
    stanceQuestion: card.primaryQuestion,
    domainLabel: DOMAIN_LABELS[card.domain],
    cardId: card.id,
  }
}
