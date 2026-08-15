/**
 * Party interpretation layer for Goodbye Yellow Brick Road.
 *
 * The canonical Oracle deck (`public/oracle/deck.json`) stays untouched — it
 * remains the source of truth for art, suit, rank, and title. This module loads
 * the generated party readings keyed by base Oracle card id and exposes typed
 * access with achievement-family validation.
 *
 * Regenerate with: npx tsx scripts/generate-goodbye-party-interpretations.ts
 */

import interpretationData from './data/interpretations.json'
import { isLegalAchievementFamily, type AchievementFamily, type Depth, type Lens } from './config'

export type PartyAchievement = {
  id: string
  family: AchievementFamily
  title: string
  description: string
  affordance: string
}

export type PartyReading = {
  prompt: string
  emotionalAlchemy?: {
    move: string
    targetSatisfaction: string
  }
  achievement?: PartyAchievement
  hard?: {
    requiresBar: boolean
  }
}

export type PartyCardInterpretation = Record<Lens, Record<Depth, PartyReading>>
export type PartyInterpretation = Record<string, PartyCardInterpretation>

const INTERPRETATIONS = interpretationData as unknown as PartyInterpretation

/** Base Oracle card ids that have party readings — the playable corpus. */
export function playableCardIds(): string[] {
  return Object.keys(INTERPRETATIONS)
}

export function getCardInterpretation(cardId: string): PartyCardInterpretation | null {
  return INTERPRETATIONS[cardId] || null
}

/**
 * One reading. Returns null when the card has no party content — the caller
 * degrades to the canonical Oracle prompt rather than failing.
 */
export function getReading(cardId: string, lens: Lens, depth: Depth): PartyReading | null {
  return INTERPRETATIONS[cardId]?.[lens]?.[depth] || null
}

/**
 * The achievement a completion should unlock, or null. An illegal family is
 * dropped rather than awarded — the six families in config.ts are the whole law.
 */
export function getReadingAchievement(
  cardId: string,
  lens: Lens,
  depth: Depth,
): PartyAchievement | null {
  const achievement = getReading(cardId, lens, depth)?.achievement
  if (!achievement) return null
  if (!isLegalAchievementFamily(achievement.family)) return null
  return achievement
}

export function readingRequiresBar(cardId: string, lens: Lens, depth: Depth): boolean {
  return Boolean(getReading(cardId, lens, depth)?.hard?.requiresBar)
}
