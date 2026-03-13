/**
 * Canonical archetype names for Admin World and filtering.
 * Used to exclude trigram-named playbooks (Heaven (Qian), etc.) from display.
 * @see docs/architecture/archetype-key-reconciliation.md
 */

export const CANONICAL_ARCHETYPE_NAMES = [
  'The Bold Heart',
  'The Devoted Guardian',
  'The Decisive Storm',
  'The Danger Walker',
  'The Still Point',
  'The Subtle Influence',
  'The Truth Seer',
  'The Joyful Connector',
] as const

export type CanonicalArchetypeName = (typeof CANONICAL_ARCHETYPE_NAMES)[number]
