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

import { translateCardForSuperpower } from '../superpowers/translate'
import type { Superpower, SuperpowerOrientation } from '../superpowers/types'
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
  /** Set when seeded through a superpower lens (Mobility Quest campaign). */
  superpower?: Superpower
  orientation?: SuperpowerOrientation
}

export interface DeckSeed {
  title: string
  description: string
  rootId: string
  provenance: DeckSeedProvenance
}

/**
 * Optional superpower lens: `Card + Superpower + Orientation = Personalized Quest`.
 * When supplied, the description gains the superpower-lens prompt + suggested
 * artifact, the provenance records both, and the rootId is namespaced so the same
 * card can seed distinct quests per superpower/orientation.
 */
export interface DeckSeedOptions {
  superpower?: Superpower
  orientation?: SuperpowerOrientation
}

/** Build the seed for a card under a chosen reading (self / for-others). */
export function buildDeckSeed(
  card: MoveCard,
  subject: SeedSubject,
  opts: DeckSeedOptions = {},
): DeckSeed {
  const question = subject === 'campaign' ? card.campaignQuestion : card.primaryQuestion
  const { superpower, orientation } = opts

  // Backward-compatible: no lens → original behavior unchanged.
  if (!superpower || !orientation) {
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

  const t = translateCardForSuperpower(card, superpower, orientation)
  return {
    title: card.title,
    description:
      `The practice: ${card.remediation}\n\n${question}\n\n` +
      `Through your ${superpower} (${orientation}) lens: ${t.prompt}\n` +
      `Artifact: ${t.suggestedArtifact}`,
    rootId: `deck_${card.id}_${superpower}_${orientation}`,
    provenance: {
      sourceType: 'deck_card',
      deck: 'allyship-deck',
      deckCardId: card.id,
      move: card.move,
      operation: card.operation,
      domain: card.domain,
      outputBar: card.outputBar,
      subject,
      superpower,
      orientation,
    },
  }
}
