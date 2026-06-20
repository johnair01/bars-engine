/**
 * Card → superpower × orientation translation (campaign Phase 1, FR3).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 *
 * The addendum's equation: Existing Allyship Card + Superpower + Orientation =
 * Personalized Quest. Deterministic — the card's own reading (deck.json) + the
 * authored matrix lens. No AI.
 */
import type { MoveCard } from '../allyship-deck/types'
import { SUPERPOWER_TRANSLATION } from './matrix'
import {
  orientationToSubject,
  type Superpower,
  type SuperpowerOrientation,
  type SuperpowerTranslation,
} from './types'

/**
 * Translate a deck card through a superpower + orientation.
 *
 * `internal` uses the card's introspective `primaryQuestion` (self-allyship);
 * `external` uses its `campaignQuestion` (world-facing). The superpower supplies
 * the lens prompt + suggested artifact from the authored matrix.
 */
export function translateCardForSuperpower(
  card: MoveCard,
  superpower: Superpower,
  orientation: SuperpowerOrientation,
): SuperpowerTranslation {
  const cell = SUPERPOWER_TRANSLATION[superpower][orientation]
  const cardReading =
    orientationToSubject(orientation) === 'self' ? card.primaryQuestion : card.campaignQuestion
  return {
    superpower,
    orientation,
    baseCardId: card.id,
    baseCardTitle: card.title,
    cardReading,
    prompt: cell.prompt,
    suggestedArtifact: cell.suggestedArtifact,
  }
}
