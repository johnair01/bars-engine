/**
 * Deck → quest seed (pure).
 *
 * Turns an authored move card into the fields a `CustomBar` "Send to BARS" seed needs:
 * the quest title, an actionable description (the practice + the card's question), a stable
 * `rootId`, and the provenance stamped into `agentMetadata`. No DB/React — unit-testable.
 *
 * @see src/actions/send-deck-card-to-bars.ts (caller)
 * @see .specify/specs/allyship-deck-experience/spec.md (slice 3)
 */

import type { MoveCard } from './types'

export type SeedSubject = 'self' | 'campaign'

export interface DeckSeedProvenance {
  sourceType: 'deck_card'
  deck: 'allyship-deck'
  deckCardId: string
  move: MoveCard['move']
  operation: MoveCard['operation']
  domain: MoveCard['domain']
  outputBar: MoveCard['outputBar']
  subject: SeedSubject
}

export interface DeckSeed {
  title: string
  description: string
  rootId: string
  provenance: DeckSeedProvenance
}

/** Build the seed for a card under a chosen reading (self / for-others). */
export function buildDeckSeed(card: MoveCard, subject: SeedSubject): DeckSeed {
  const question = subject === 'campaign' ? card.campaignQuestion : card.primaryQuestion
  return {
    title: card.title,
    description: `The practice: ${card.remediation}\n\n${question}`,
    rootId: `deck_${card.id}`,
    provenance: {
      sourceType: 'deck_card',
      deck: 'allyship-deck',
      deckCardId: card.id,
      move: card.move,
      operation: card.operation,
      domain: card.domain,
      outputBar: card.outputBar,
      subject,
    },
  }
}
