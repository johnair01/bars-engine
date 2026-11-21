export const LENS_DOMAINS = [
  {
    key: 'relationships',
    label: 'Relationships',
    glyph: '○',
    prompt: 'Who are you with? What is the quality of contact? Write toward what you actually want.',
  },
  {
    key: 'career',
    label: 'Career',
    glyph: '◇',
    prompt: 'What are you making, practicing, selling, serving, or becoming known for?',
  },
  {
    key: 'money',
    label: 'Money',
    glyph: '◈',
    prompt: 'What flow of income, stability, generosity, or receiving would change your life?',
  },
  {
    key: 'health',
    label: 'Health',
    glyph: '●',
    prompt: 'What body, energy, rhythm, and practice would carry you?',
  },
  {
    key: 'allyship',
    label: 'Allyship',
    glyph: '◆',
    prompt: 'Who is better off because you showed up?',
  },
] as const

export type LensDomainKey = (typeof LENS_DOMAINS)[number]['key']

export const LENS_DOMAIN_KEYS = LENS_DOMAINS.map((domain) => domain.key) as LensDomainKey[]

export function isLensDomainKey(value: string): value is LensDomainKey {
  return (LENS_DOMAIN_KEYS as readonly string[]).includes(value)
}

export function getLensDomain(key: LensDomainKey) {
  return LENS_DOMAINS.find((domain) => domain.key === key) ?? LENS_DOMAINS[0]
}

/**
 * Satisfaction is a modifier on the channel, not a separate vocabulary: the player picks
 * which of the five they are moving toward, and may add their own words. Mirrors the
 * engine's Element names (src/lib/ember-economy/.../engine/data/channels.ts).
 */
export type LensChannel = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water'

export const LENS_CHANNELS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const

export const LENS_SATISFACTION: { channel: LensChannel; label: string }[] = [
  { channel: 'Wood', label: 'Joy · growth and possibility' },
  { channel: 'Fire', label: 'Clear action · a boundary held' },
  { channel: 'Earth', label: 'Groundedness · steady center' },
  { channel: 'Metal', label: 'Clarity · precision and perspective' },
  { channel: 'Water', label: 'Peace · flow and repair' },
]

/**
 * The dissatisfied side is its own closed set: five channels, seven names. Two channels carry a
 * pair of names for one position (Earth: apathy, boredom. Water: despair, depression) — that is
 * provisional, one position with two names, not two positions.
 *
 * Both sides are closed so the player picks rather than types. Their own words sit on top of a
 * pick; they never replace it.
 */
export const LENS_DISSATISFACTION: { channel: LensChannel; labels: readonly string[] }[] = [
  { channel: 'Wood', labels: ['craving'] },
  { channel: 'Fire', labels: ['frustration'] },
  { channel: 'Earth', labels: ['apathy', 'boredom'] },
  { channel: 'Metal', labels: ['anxiety'] },
  { channel: 'Water', labels: ['despair', 'depression'] },
]

export type LensDissatisfiedPosition = (typeof LENS_DISSATISFACTION)[number]['labels'][number]

export function isLensDissatisfiedPosition(value: string): value is LensDissatisfiedPosition {
  return LENS_DISSATISFACTION.some((option) => (option.labels as readonly string[]).includes(value))
}

export function isLensChannel(value: string): value is LensChannel {
  return (LENS_CHANNELS as readonly string[]).includes(value)
}
