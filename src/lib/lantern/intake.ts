/**
 * The intake as a game (brief "Lantern Hall, port 1", step 2; position lh-intake-order). Pure helpers for the six steps
 * the reel plays on the board: goal → toward (gold) → now (lead, with intensity) → truth → reservations → tags. Every
 * step is a tap; typing is only ever optional context. The page (`src/app/lantern`) draws these, and the engine deals the
 * table from the result, so the board shown while the player taps is the board they will play.
 */
import { CHANNELS, KEEPS, blockLeft, init, type Channel, type Intake, type TagStrength } from './engine'

export const STEPS = ['Goal', 'Toward', 'Now', 'Truth', 'Reservations', 'Tag'] as const
export type Step = 1 | 2 | 3 | 4 | 5 | 6

export const QUESTION: Record<Step, string> = {
  1: 'What do you want to get done?',
  2: 'What satisfied state will that get you?',
  3: 'How does it feel to live here now?',
  4: 'What would have to be true for it to feel this way?',
  5: 'What reservations do you have about it?',
  6: 'Which feeling does each reservation stir?',
}

/** Goal chips: done-or-not sentences anyone can pick. "Something else" opens the optional typed line. */
export const GOALS: readonly string[] = ['Make one ask today', 'Finish the thing I keep putting off', 'Show my work to someone']

/** The neutral feeling each channel names when the player says how it feels now (the reel's FEEL). */
export const FEEL: Record<Channel, string> = { fire: 'Anger', wood: 'Joy', water: 'Sadness', metal: 'Fear', earth: 'Neutrality' }
/** The one truth statement per channel (the reel's TRUTH). */
export const TRUTH: Record<Channel, string> = {
  fire: 'There’s an obstacle I don’t know how to overcome.',
  wood: 'Something I want is missing.',
  water: 'I’ve lost something that mattered.',
  metal: 'There’s a threat I can’t escape.',
  earth: 'The challenge itself isn’t engaging.',
}
export const STRENGTH = ['', 'Minor', 'Medium', 'Major'] as const

/** The six reservations, one per keep, in words a player says about their own work. */
export const RESERVATION: readonly string[] = [
  'I’m not good enough to ask for this.',
  'I’m not worthy of bringing this into the world.',
  'I won’t belong among the people I make it for.',
  'I’m not capable of finishing it.',
  'It won’t matter to anyone.',
  'I’m not ready to be seen doing it.',
]

export const emptyIntake = (): Intake => ({
  goal: '', want: [], now: {}, truth: {}, truthCtx: {}, res: KEEPS.map(() => true), tags: KEEPS.map(() => ({})),
})

const cycle = (v: number | undefined) => (((v ?? 0) + 1) % 4) as TagStrength

/** Each tap returns a new intake; nothing is mutated, so a page can keep its history. */
export const pickGoal = (x: Intake, goal: string): Intake => ({ ...x, goal })
export const toggleWant = (x: Intake, c: Channel): Intake => ({
  ...x, want: x.want.includes(c) ? x.want.filter(w => w !== c) : CHANNELS.filter(w => w === c || x.want.includes(w)),
})
/** Tap to raise the intensity: Minor, Medium, Major, then off. Turning a feeling on turns its truth on. */
export function raiseNow(x: Intake, c: Channel): Intake {
  const v = cycle(x.now[c])
  const now = { ...x.now }
  if (v) now[c] = v; else delete now[c]
  const truth = { ...x.truth }
  if (v && truth[c] === undefined) truth[c] = true
  return { ...x, now, truth }
}
export const toggleTruth = (x: Intake, c: Channel): Intake => ({ ...x, truth: { ...x.truth, [c]: !x.truth[c] } })
export const setTruthCtx = (x: Intake, c: Channel, text: string): Intake => ({ ...x, truthCtx: { ...x.truthCtx, [c]: text } })
export const toggleRes = (x: Intake, i: number): Intake => ({ ...x, res: x.res.map((r, k) => (k === i ? !r : r)) })
/** Tag a reservation with a feeling, and tap again to raise it: Minor, Medium, Major, then off. */
export function raiseTag(x: Intake, i: number, c: Channel): Intake {
  const tags = x.tags.map(t => ({ ...t }))
  const v = cycle(tags[i][c])
  if (v) tags[i][c] = v; else delete tags[i][c]
  return { ...x, tags }
}

/** The feelings felt now, in channel order: step 4 asks a truth for each and step 6 offers them first. */
export const feltNow = (x: Intake) => CHANNELS.filter(c => (x.now[c] ?? 0) > 0)

/** Whether the player may go on from a step. Only the goal is required; every other step can be left as it is. */
export const mayLeave = (x: Intake, s: Step) => (s === 1 ? x.goal.trim().length > 0 : true)

/** The block the intake deals: refinements to overcome it, and about how many matched moves and watches of oil. */
export function blockCost(x: Intake) {
  const n = blockLeft(init(x))
  const moves = Math.ceil(n / 2)
  return { refinements: n, moves, watches: Math.ceil(moves / 4) }
}
