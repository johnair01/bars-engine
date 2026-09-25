/**
 * Goodbye Yellow Brick Road — Oracle party one-shot.
 *
 * Party-scoped constants. Isolated from the Valkyrie party instance by slug so
 * the two parties can never overwrite each other's rows.
 * See .specify/specs/goodbye-yellow-brick-road-party-one-shot/spec.md
 */

export const GOODBYE_PARTY_SLUG = 'goodbye-yellow-brick-road'

/** Saturday Aug 15, 2026, 8:00 PM America/Los_Angeles (PDT, UTC-7). */
export const PARTY_START_ISO = '2026-08-15T20:00:00-07:00'

/** Sunday Aug 16, 2026, 12:00 AM America/Los_Angeles (PDT, UTC-7). */
export const SPICY_UNLOCK_ISO = '2026-08-16T00:00:00-07:00'

/** 12 GM slots at 20-minute cadence, 8:00 PM through 11:40 PM PDT. */
export const GM_SLOT_COUNT = 12
export const GM_SLOT_INTERVAL_MINUTES = 20

export const HAND_SIZE = 3

export const LENSES = ['goodbye', 'spicy'] as const
export type Lens = (typeof LENSES)[number]

export const DEPTHS = ['easy', 'medium', 'hard'] as const
export type Depth = (typeof DEPTHS)[number]

/**
 * Legal achievement families. An achievement may grant permission, credibility,
 * access, resources, or facilitation rights for initiating play. It never creates
 * authority over another person's consent, boundaries, or ordinary agency.
 */
export const ACHIEVEMENT_FAMILIES = [
  'invocation',
  'challenge',
  'stewardship',
  'coordination',
  'interface',
  'legacy',
] as const
export type AchievementFamily = (typeof ACHIEVEMENT_FAMILIES)[number]

export function isLegalAchievementFamily(value: unknown): value is AchievementFamily {
  return typeof value === 'string' && (ACHIEVEMENT_FAMILIES as readonly string[]).includes(value)
}

/** Palette: deep emerald, road gold, warm cream, midnight plum. Oracle art unchanged. */
export const GOODBYE_PALETTE = {
  background: '#07281F',
  panel: 'rgba(255, 243, 220, 0.07)',
  emerald: '#0F3D30',
  gold: '#E3B341',
  cream: '#F7EFDD',
  plum: '#2A1435',
  spicy: '#D4456B',
} as const
