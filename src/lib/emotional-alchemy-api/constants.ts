/**
 * Emotional Alchemy API — Canonical Constants
 *
 * Single source of truth for channels, altitudes, and transition types.
 * Used by validate-state, resolve-move, and API routes.
 *
 * See: .agent/context/emotional-alchemy-ontology.md
 * See: .agent/context/emotional-alchemy-interfaces.md
 */

/** Canonical emotional channels (API surface: lowercase) */
export const EMOTIONAL_CHANNELS = ['anger', 'joy', 'sadness', 'fear', 'neutrality'] as const
export type EmotionalChannelId = (typeof EMOTIONAL_CHANNELS)[number]

/** Satisfaction altitudes */
export const SATISFACTION_ALTITUDES = ['dissatisfied', 'neutral', 'satisfied'] as const
export type SatisfactionAltitude = (typeof SATISFACTION_ALTITUDES)[number]

/** Move type: transcend = same-channel, translate = cross-channel */
export const MOVE_TYPES = ['transcend', 'translate'] as const
export type MoveType = (typeof MOVE_TYPES)[number]

/** Transition type for transcend moves */
export const TRANSITION_TYPES = ['stabilization', 'activation', 'integration'] as const
export type TransitionType = (typeof TRANSITION_TYPES)[number]

/** Channel → element key (for mapping to move-engine) */
export const CHANNEL_TO_ELEMENT: Record<EmotionalChannelId, string> = {
  anger: 'fire',
  joy: 'wood',
  sadness: 'water',
  fear: 'metal',
  neutrality: 'earth',
}

/** Element key → channel */
export const ELEMENT_TO_CHANNEL: Record<string, EmotionalChannelId> = {
  fire: 'anger',
  wood: 'joy',
  water: 'sadness',
  metal: 'fear',
  earth: 'neutrality',
}

/** Valid same-channel altitude transitions */
export const LEGAL_ALTITUDE_TRANSITIONS: Record<SatisfactionAltitude, SatisfactionAltitude[]> = {
  dissatisfied: ['neutral'],
  neutral: ['satisfied'],
  satisfied: ['neutral'],
}
