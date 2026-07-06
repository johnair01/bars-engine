/**
 * Emotional Alchemy Tool Registry — public API.
 * Spec: .specify/specs/emotional-alchemy-tool-registry/spec.md § API Contracts
 *
 * Pure accessors over the canonical tool data. Selection *policy* (guards as
 * blocks, scoring, tiebreaks) belongs to the composer (Atlas §10 target 3);
 * this module only answers "what is rated what."
 */

import type {
  BlockerShape,
  EmotionalAlchemyTool,
  EmotionChannel,
  ToolRating,
  WaveLens,
} from './types'
import { EMOTIONAL_ALCHEMY_TOOLS } from './registry'

export * from './types'
export * from './vector'
export { EMOTIONAL_ALCHEMY_TOOLS, HARD_GUARDS, SPIRIT_STEPS, EMOTION_TO_ELEMENT } from './registry'

const RATING_ORDER: Record<ToolRating, number> = {
  not_recommended: 0,
  weak: 1,
  medium: 2,
  strong: 3,
}

const BY_ID = new Map(EMOTIONAL_ALCHEMY_TOOLS.map((t) => [t.id, t]))
const BY_SLUG = new Map(EMOTIONAL_ALCHEMY_TOOLS.map((t) => [t.slug, t]))

export function getToolById(id: string): EmotionalAlchemyTool | undefined {
  return BY_ID.get(id)
}

export function getToolBySlug(slug: string): EmotionalAlchemyTool | undefined {
  return BY_SLUG.get(slug)
}

/** True when `rating` is at least `min` on the not_recommended < weak < medium < strong scale. */
export function ratingAtLeast(rating: ToolRating, min: ToolRating): boolean {
  return RATING_ORDER[rating] >= RATING_ORDER[min]
}

/** Tools rated at least `min` (default 'strong') for a WAVE submove, registry order. */
export function toolsForSubmove(lens: WaveLens, min: ToolRating = 'strong'): EmotionalAlchemyTool[] {
  return EMOTIONAL_ALCHEMY_TOOLS.filter((t) => ratingAtLeast(t.waveRatings[lens], min))
}

/** Tools rated at least `min` (default 'strong') for an emotion channel, registry order. */
export function toolsForChannel(channel: EmotionChannel, min: ToolRating = 'strong'): EmotionalAlchemyTool[] {
  return EMOTIONAL_ALCHEMY_TOOLS.filter((t) => ratingAtLeast(t.channelRatings[channel], min))
}

/** Tools carrying the shape-bonus key for a blocker shape (Atlas §4.1 shape map). */
export function toolForShape(shape: BlockerShape): EmotionalAlchemyTool[] {
  return EMOTIONAL_ALCHEMY_TOOLS.filter((t) => t.shapeBonusKeys.includes(shape))
}
