/**
 * The I-5 corridor the tour actually runs, and the prompts that pull leads out
 * of a person's memory.
 *
 * Two audiences, one artifact, on purpose. The same prompts that jog Wendell's
 * own recall are the ones handed to backers and readers, because a question
 * good enough to surface a forgotten contact is good enough for anybody with a
 * contact to forget. Writing them twice would produce two lists that disagree.
 */

export type CorridorTier = 'anchor' | 'reach'

export interface CorridorCity {
  name: string
  state: 'OR' | 'WA'
  tier: CorridorTier
}

/**
 * Anchors are the three the tour is built around. Reach cities are on the same
 * line and worth a stop when a real invitation appears there, rather than
 * targets to manufacture one for.
 */
export const CORRIDOR: readonly CorridorCity[] = [
  { name: 'Eugene', state: 'OR', tier: 'reach' },
  { name: 'Salem', state: 'OR', tier: 'reach' },
  { name: 'Portland', state: 'OR', tier: 'anchor' },
  { name: 'Vancouver', state: 'WA', tier: 'reach' },
  { name: 'Olympia', state: 'WA', tier: 'reach' },
  { name: 'Tacoma', state: 'WA', tier: 'anchor' },
  { name: 'Seattle', state: 'WA', tier: 'anchor' },
  { name: 'Everett', state: 'WA', tier: 'reach' },
  { name: 'Bellingham', state: 'WA', tier: 'reach' },
] as const

export const CORRIDOR_CITY_NAMES: readonly string[] = CORRIDOR.map((c) => c.name)

export function isCorridorCity(name: string): boolean {
  const needle = name.trim().toLowerCase()
  return CORRIDOR.some((c) => c.name.toLowerCase() === needle)
}

/** What kind of lead somebody is naming. */
export const LEAD_KINDS = [
  { key: 'bookstore', label: 'A bookstore' },
  { key: 'venue', label: 'A space that hosts events' },
  { key: 'org', label: 'An organization that trains its people' },
  { key: 'show', label: 'A podcast, newsletter or show' },
  { key: 'facilitator', label: 'Someone who already does this work' },
  { key: 'other', label: 'Something else' },
] as const

export type LeadKind = (typeof LEAD_KINDS)[number]['key']
export const LEAD_KIND_KEYS: ReadonlySet<string> = new Set(LEAD_KINDS.map((k) => k.key))

/**
 * Recall prompts.
 *
 * Written to ask about the past rather than the future. "Who do you know in
 * Seattle" returns a blank; "who has already had you speak, anywhere" returns
 * a name, because episodic memory answers questions about events and goes
 * quiet on questions about categories.
 *
 * The weak-tie prompts are last and they are the valuable ones — a close friend
 * is already on the list, and the person you met once at a conference is not.
 */
export const RECALL_PROMPTS: readonly string[] = [
  'Who has already had you speak, teach, or run a session — paid or not, however small?',
  'Which bookstore do you actually shop at, and who behind the counter knows your face?',
  'Who invited you to something in the last two years that you said yes to?',
  'Which of the three hundred and seventy-one backers can you name without looking?',
  'Who runs a space you have physically been inside — a studio, a hall, a shop after hours?',
  'Who has a podcast, a newsletter, or a group chat with more than two hundred people in it?',
  'Who did this work alongside you at Blue Sky, and where did they land afterward?',
  'Which facilitator have you watched work and thought, they are already doing this?',
  'Who asked you for a copy and never got a follow-up from you?',
  'Who have you met exactly once, at a conference, and liked?',
  'Which organization near you has already paid somebody for training like this?',
  'Who owes you nothing and likes you anyway?',
] as const
