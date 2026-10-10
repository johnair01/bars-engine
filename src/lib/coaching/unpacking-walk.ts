/**
 * The forest walk as the six unpacking questions (Wendell, 2026-10-09: "what I want is for
 * this to be a gamified version of the 6 unpacking questions"). The design is
 * content/coaching-game/6FACE_PASS3_2026-10-09.md.
 *
 * The six questions are the quest grammar's (src/lib/quest-grammar/unpacking-constants.ts,
 * UNPACKING_QUESTIONS), reworded for a stranger. The feeling states are Emotional Alchemy's
 * five channels as src/lib/alchemy/alchemy-graph.ts gives them: each channel's satisfied
 * state is something to walk toward (question 2), and its dissatisfied states are how it
 * feels to live where you are (question 4). The jobs come from the ontology game's
 * CHANNEL_JOBS (via coaching-map.ts), and the six reservations are the quest grammar's
 * SHADOW_VOICE_OPTIONS. The tests check all three against their sources.
 *
 * Kept pure so the routing and the record can be tested without rendering anything.
 */

import { FEELINGS } from './coaching-map'
import type { FeelingName } from './coaching-map'

export type Channel = 'anger' | 'sadness' | 'fear' | 'joy' | 'neutrality'

export const CHANNEL_NAME: Record<Channel, FeelingName> = {
  anger: 'Anger',
  sadness: 'Sadness',
  fear: 'Fear',
  joy: 'Joy',
  neutrality: 'Neutrality',
}

/** The light each channel gives the forest when it is what the visitor walks toward. A design choice. */
export const CHANNEL_LIGHT: Record<Channel, string> = {
  anger: '#ff9a6b',
  sadness: '#8fb8ff',
  fear: '#e6edf5',
  joy: '#b6f08a',
  neutrality: '#f3d79a',
}

/**
 * Question 1. Wendell asked for "a few options that I know I Can help with". These are the
 * council's draft from his offers (position cf-experiences); he can rewrite any of them.
 * `allyship` routes to allyship coaching; the rest route to coaching for self-sabotage.
 */
export const EXPERIENCES = [
  { id: 'build', text: 'Finally build what I keep putting off', allyship: false },
  { id: 'alive', text: 'Feel alive in my days again', allyship: false },
  { id: 'pattern', text: 'Stop repeating the same pattern with people', allyship: false },
  { id: 'show-up', text: 'Show up well for people who are treated differently than me', allyship: true },
  { id: 'lead', text: 'Lead my team or community through something hard', allyship: true },
] as const

export type ExperienceId = (typeof EXPERIENCES)[number]['id']

/** Question 2: each channel's satisfied state (alchemy-graph `satisfied.label`) and what it means. */
export const SATISFACTIONS: ReadonlyArray<{ channel: Channel; state: string; means: string }> = [
  { channel: 'anger', state: 'triumph', means: 'You use your power cleanly, a boundary is honoured, and what was stuck moves.' },
  { channel: 'sadness', state: 'poignance', means: 'You are close to what you care about, and it means something.' },
  { channel: 'fear', state: 'excitement', means: 'You see the risk clearly and have the nerve to step into it.' },
  { channel: 'joy', state: 'bliss', means: 'You feel delight, and you get to share it and play.' },
  { channel: 'neutrality', state: 'peace', means: 'You feel settled and present. You can see the whole, and nothing pulls at you.' },
]

/**
 * Question 4: the dissatisfied states, two per channel, taken from alchemy-graph
 * (`dissatisfied.label` and its aliases) in everyday words.
 */
export const DISSATISFACTIONS: ReadonlyArray<{ channel: Channel; state: string }> = [
  { channel: 'fear', state: 'anxious' },
  { channel: 'fear', state: 'worried' },
  { channel: 'sadness', state: 'heavy' },
  { channel: 'sadness', state: 'far from what matters' },
  { channel: 'joy', state: 'restless' },
  { channel: 'joy', state: 'comparing myself' },
  { channel: 'anger', state: 'frustrated' },
  { channel: 'anger', state: 'resentful' },
  { channel: 'neutrality', state: 'numb' },
  { channel: 'neutrality', state: 'flat' },
]

/** Question 4 also asks where it sits. The figure's regions, in the order the figure draws them. */
export const BODY_REGIONS = ['head', 'throat', 'chest', 'belly', 'arms and hands', 'legs and feet'] as const
export type BodyRegion = (typeof BODY_REGIONS)[number]

/** Question 6: the six self-sabotaging beliefs (SHADOW_VOICE_OPTIONS), each with how it tends to sound. */
export const BELIEFS: ReadonlyArray<{ belief: string; sounds: string }> = [
  { belief: 'I’m not ready', sounds: 'I need to be further along before I start.' },
  { belief: 'I’m not worthy', sounds: 'Who am I to want this?' },
  { belief: 'I’m not capable', sounds: 'I will try and get it wrong.' },
  { belief: 'I’m insignificant', sounds: 'It would not matter if I did.' },
  { belief: 'I don’t belong', sounds: 'This is for other people.' },
  { belief: 'I’m not good enough', sounds: 'Someone else would do it better.' },
]

export type Walk = {
  experience: ExperienceId | ''
  /** The visitor's own words for question 1, when none of the options fits. */
  experienceOwn: string
  toward: Channel[]
  now: string
  where: BodyRegion[]
  feels: string[]
  truth: string
  reservations: string[]
}

export const EMPTY_WALK: Walk = {
  experience: '',
  experienceOwn: '',
  toward: [],
  now: '',
  where: [],
  feels: [],
  truth: '',
  reservations: [],
}

/** Toggle one value in a list, for the questions where the visitor can choose more than one. */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/** The channels behind the states the visitor chose in question 4, in the order they chose them. */
export function feltChannels(walk: Walk): Channel[] {
  const out: Channel[] = []
  for (const s of walk.feels) {
    const c = DISSATISFACTIONS.find((d) => d.state === s)?.channel
    if (c && !out.includes(c)) out.push(c)
  }
  return out
}

/** Question 5 offers the job of each feeling behind what they chose (CHANNEL_JOBS, via FEELINGS). */
export function jobsFor(walk: Walk) {
  return feltChannels(walk).map((c) => {
    const f = FEELINGS.find((x) => x.name === CHANNEL_NAME[c])!
    return { channel: c, name: f.name, job: f.job, question: f.question }
  })
}

export type Offer = {
  id: 'allyship-coaching' | 'coaching' | 'allyship-book' | 'joy-book'
  title: string
  why: string
  href: string
  cta: string
}

const OFFERS: Record<Offer['id'], Omit<Offer, 'why'>> = {
  'allyship-coaching': {
    id: 'allyship-coaching',
    title: 'Allyship coaching',
    href: '/mastering-allyship/one-to-one',
    cta: 'Apply for allyship coaching',
  },
  coaching: {
    id: 'coaching',
    title: 'Coaching: overcoming self-sabotage through Emotional Alchemy',
    href: '#book',
    cta: 'Sit down with me',
  },
  'allyship-book': {
    id: 'allyship-book',
    title: 'Mastering the Game of Allyship',
    href: '/mastering-allyship',
    cta: 'See the book',
  },
  'joy-book': {
    id: 'joy-book',
    title: 'Igniting Joy',
    href: '/igniting-joy',
    cta: 'See the book',
  },
}

/**
 * Where the walk leads (Wendell: "they should be pushed to whatever solution I have that best
 * fit's their situation [...] Most things will be solved under emotinoal alchemy and self
 * sabotage"). The first offer is the one the centre leads with; the rest sit under it. The
 * rules are the council's (position cf-routing):
 * - An allyship experience leads with allyship coaching, and the allyship book comes with it.
 * - Everything else leads with coaching for self-sabotage.
 * - Joy chosen as the light, or a joy state chosen as how it feels, adds Igniting Joy.
 * - Coaching for self-sabotage is always offered, because most things are solved there.
 */
export function recommend(walk: Walk): Offer[] {
  const exp = EXPERIENCES.find((e) => e.id === walk.experience)
  const reasons: Partial<Record<Offer['id'], string>> = {}
  const order: Offer['id'][] = []
  const add = (id: Offer['id'], why: string) => {
    if (order.includes(id)) return
    order.push(id)
    reasons[id] = why
  }
  const held = walk.reservations.length
  const selfSabotageWhy =
    held > 0
      ? `You named ${held === 1 ? 'a reservation' : `${held} reservations`}. That is the voice we work with: what it protects, and how to get it working for you.`
      : 'We meet the part of you that keeps stalling, hear what it protects, and put its strength to work on what you want.'

  if (exp?.allyship) {
    add('allyship-coaching', 'You want to show up for other people. This is the coaching built on my book, for exactly that.')
    add('coaching', selfSabotageWhy)
    add('allyship-book', 'The book behind the coaching, if you want to start on your own.')
  } else {
    add('coaching', selfSabotageWhy)
  }
  if (walk.toward.includes('joy') || feltChannels(walk).includes('joy')) {
    add('joy-book', 'You are walking toward delight. This book is about finding it and keeping it.')
  }
  return order.map((id) => ({ ...OFFERS[id], why: reasons[id]! }))
}

/** The plain-text record the visitor copies, written to paste into Calendly's notes box. */
export function composeWalk(walk: Walk): string {
  const lines = ['What I brought out of the forest']
  const exp = EXPERIENCES.find((e) => e.id === walk.experience)?.text ?? walk.experienceOwn.trim()
  if (exp) lines.push('', `What I want to create: ${exp}`)
  const toward = SATISFACTIONS.filter((s) => walk.toward.includes(s.channel)).map((s) => s.state)
  if (toward.length) lines.push(`What it will get me: ${toward.join(', ')}`)
  if (walk.now.trim()) lines.push(`What life is like now: ${walk.now.trim()}`)
  if (walk.feels.length || walk.where.length) {
    const feels = walk.feels.join(', ')
    const where = walk.where.length ? ` (in my ${walk.where.join(', ')})` : ''
    lines.push(`How it feels here: ${feels || 'something'}${where}`)
  }
  if (walk.truth.trim()) lines.push(`What would have to be true: ${walk.truth.trim()}`)
  if (walk.reservations.length) lines.push(`What holds me back: ${walk.reservations.join('; ')}`)
  return lines.join('\n')
}
