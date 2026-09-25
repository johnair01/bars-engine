/**
 * MTGOA Grow Up Check — Day 4 copy and the capacity vocabulary (pure).
 *
 * Everything the flow says lives here so `GrowUpCheck.tsx` stays layout + state.
 *
 * Two authorities, and they disagree in places:
 *
 *  - The prototype, `.specify/specs/mtgoa-grow-up-check/design_handoff/MTGOA Grow
 *    Up Check.dc.html`, plus `DAY_4_GROW_UP_PAGE_SPEC_2026-08-20.md`. Most of the
 *    authored vocabulary below — the reps, the reservations, the supports and
 *    boundaries — comes from the prototype and is reproduced faithfully.
 *  - `MTGOA_DAYS_1_TO_5_HOSTILE_REVIEW_2026-08-21.md`, which is newer and wins
 *    where they conflict. Its three required changes for Day 4 are marked below.
 *
 * Privacy invariant: like Days 1 and 5, Day 4 composes nothing outbound from free
 * text. The reminder the reader can copy is assembled from canonical strings in
 * this module only — never from anything they typed, and never from a person's name.
 */

import { GROW_UP_RAISE_AWARENESS_PRACTICES } from '@/lib/mtgoa-course/course-days'
import type { MoveCard } from '@/lib/allyship-deck/types'

/** Day 4 narrows to round 1's six Grow Up × Raise Awareness cards, like Day 5. */
export const GROW_UP_PRACTICES: MoveCard[] = GROW_UP_RAISE_AWARENESS_PRACTICES

export const GROW_UP_CARD_IDS = new Set(GROW_UP_PRACTICES.map((card) => card.id))

/**
 * The starting hand, as three *equal* choices.
 *
 * Review failure risk 1: "people already trust your taste" reads as flattery to
 * one reader and as an accusation of insignificance to another. So not-sure is a
 * first-class answer that routes back to Day 1 — the course does not assume
 * everyone arrives with a usable network.
 */
export type GrowUpScope = 'one_person' | 'small_room' | 'not_sure'

export const GROW_UP_SCOPES: ReadonlyArray<{ key: GrowUpScope; label: string; body: string }> = [
  {
    key: 'one_person',
    label: 'One person.',
    body: 'Someone specific who would take a recommendation from me seriously.',
  },
  {
    key: 'small_room',
    label: 'A small room.',
    body: 'A team, a group chat, a class, a circle — somewhere my word already carries a little weight.',
  },
  {
    key: 'not_sure',
    label: 'I am not sure yet.',
    body: 'That is a real answer, and it is a Day 1 question. Nothing here requires you to already have a network.',
  },
]

/** What could honestly change hands. Named for the reader, not for the campaign. */
export const GROW_UP_HANDOFFS = [
  { key: 'book', label: 'Put the book in their hands', ask: 'The ask is simple: read Mastering the Game of Allyship.' },
  { key: 'speak', label: 'Bring me in to speak', ask: 'The ask is an introduction to whoever books speakers.' },
  { key: 'coach', label: 'Invite them into group coaching', ask: 'The ask is a seat in a facilitated group.' },
] as const

/**
 * The book's six self-sabotaging beliefs in handoff framing, each paired with the
 * capacity on the other side of it — which is what makes this a Grow Up screen
 * rather than a second Clean Up.
 *
 * A reader meets these six on Days 1, 3 and 4. That repetition is the course.
 * `none` is offered so the screen never reads as "pick your defect".
 */
export const GROW_UP_BELIEFS = [
  { key: 'worthy', voice: '“Who am I to put this in front of anyone?”', belief: 'I’m not worthy', capacity: 'Speaking from your own experience instead of borrowed authority.' },
  { key: 'capable', voice: '“I’ll say it wrong and it’ll land badly.”', belief: 'I’m not capable', capacity: 'Saying one true sentence plainly, without rehearsing it into mush.' },
  { key: 'good', voice: '“If they say no, that’s a verdict on me.”', belief: 'I’m not good enough', capacity: 'Making an offer that another person is free to decline.' },
  { key: 'ready', voice: '“I should know more before I bring this to anyone.”', belief: 'I’m not ready', capacity: 'Handing off what has already landed in you, unfinished.' },
  { key: 'belong', voice: '“It feels gross to offer something to my own people.”', belief: 'I don’t belong', capacity: 'Telling a handoff apart from a sale — and asking anyway.' },
  { key: 'insig', voice: '“My circle doesn’t care about this.”', belief: 'I’m insignificant', capacity: 'Making one specific ask of one specific person.' },
] as const

/** Always offered. A reservation is a pattern to work with, never a diagnosis. */
export const GROW_UP_NO_BELIEF = 'None of these — nothing is in the way today.'

/**
 * Per-card guidance: each Game Master's operation as the one thing it asks of a
 * rep. Operations are verbs, not reader types.
 */
export const GROW_UP_CARD_PROMPTS: Record<string, string> = {
  'GROW-RA-SHAMAN': 'Practise seeing or saying one thing you usually leave unspoken.',
  'GROW-RA-CHALLENGER': 'Practise the sentence you have been avoiding.',
  'GROW-RA-REGENT': 'Choose a rep you can still repeat next week.',
  'GROW-RA-ARCHITECT': 'Practise the communication skill that would make this land more clearly.',
  'GROW-RA-DIPLOMAT': 'Practise a bolder truth while tending the relationship it touches.',
  'GROW-RA-SAGE': 'Practise one act that matches the person you are becoming.',
}

/**
 * The reps. `faces` marks which Game Masters suggest which — a carried card
 * surfaces its own first, but every rep stays choosable. The card interrupts a
 * habitual answer; it does not narrow the menu to one.
 */
export const GROW_UP_REPS = [
  { key: 'recommend', label: 'making one honest recommendation, with my real reason', faces: ['architect', 'diplomat'] },
  { key: 'avoided', label: 'saying the sentence I’ve been avoiding, out loud, once', faces: ['challenger'] },
  { key: 'unspoken', label: 'saying one thing I usually leave unspoken', faces: ['shaman'] },
  { key: 'moment', label: 'naming what I notice in a room while it’s happening', faces: ['shaman'] },
  { key: 'why', label: 'telling one person why this actually mattered to me', faces: ['sage', 'architect'] },
  { key: 'intro', label: 'asking for one introduction', faces: ['challenger', 'regent'] },
  { key: 'weekly', label: 'holding the same hard conversation on a repeat', faces: ['regent'] },
  { key: 'listen', label: 'listening through one conversation without fixing it', faces: ['regent', 'diplomat'] },
  { key: 'askfirst', label: 'asking what they need before I offer anything', faces: ['diplomat'] },
  { key: 'tend', label: 'checking back with someone my bolder voice landed on', faces: ['diplomat'] },
  { key: 'dontknow', label: 'saying “I don’t know” instead of performing certainty', faces: ['sage'] },
  { key: 'callin', label: 'calling one person in privately instead of staying quiet', faces: ['challenger', 'shaman'] },
  { key: 'plain', label: 'saying it in one sentence, with no hedging', faces: ['architect'] },
  { key: 'becoming', label: 'doing one thing that matches who I’m becoming', faces: ['sage'] },
] as const

/**
 * What makes the rep possible. Review failure risk 2: Grow Up collapses into
 * emotional courage unless the practice names capability, **support** and
 * **boundary** together. Fuel is a real cost.
 */
export const GROW_UP_SUPPORTS = [
  'writing the first sentence down before I say it',
  'telling one person that I’m doing it',
  'starting with the easiest room',
  'doing it before I talk myself out of it',
  'asking someone to be in the room with me',
  'giving myself a single try and stopping there',
] as const

/** Where the rep stops. A clean "not today" is a capable move, not a failure. */
export const GROW_UP_BOUNDARIES = [
  'they’re not up for it',
  'I notice I’m pushing',
  'it turns into a pitch',
  'I’m doing it to be seen',
  'I don’t have the fuel today',
  'I need to stop and come back to it',
] as const

export const GROW_UP_WHERE = ['in person', 'on a call', 'by text or DM', 'by email', 'in a group chat', 'in a meeting', 'in a post'] as const
export const GROW_UP_WHEN = ['today', 'in the next 24 hours', 'this week', 'the next time it comes up', 'at a time I’ll set myself'] as const

/** Where the rep lands. Selecting one never schedules anything. */
export const GROW_UP_CONTAINERS = [
  { key: '24h', label: 'In the next 24 hours' },
  { key: 'week', label: 'This week' },
  { key: 'own', label: 'I will add my own reminder' },
  { key: 'later', label: 'I will come back later' },
] as const

export const GROW_UP_RECEIPT = {
  eyebrow: 'your Day 4 receipt',
  title: 'You have a capacity practice.',
  body: 'You have one rep that can teach you something. That is the whole of today.',
  empty: 'You kept it all in your head. That still counts — the rep is the thing.',
  closing: 'closing the tab is also a complete move.',
} as const

export function findGrowUpRep(key: string | null) {
  return GROW_UP_REPS.find((rep) => rep.key === key) ?? null
}

export function findGrowUpBelief(key: string | null) {
  return GROW_UP_BELIEFS.find((belief) => belief.key === key) ?? null
}

/**
 * Reps the carried card suggests, then the rest. Never a filtered list — a reader
 * who wants a different rep than their card nudges toward can still pick it.
 */
export function growUpRepsFor(face: string | null): { suggested: typeof GROW_UP_REPS[number][]; rest: typeof GROW_UP_REPS[number][] } {
  if (!face) return { suggested: [], rest: [...GROW_UP_REPS] }
  const suggested = GROW_UP_REPS.filter((rep) => (rep.faces as readonly string[]).includes(face))
  const rest = GROW_UP_REPS.filter((rep) => !(rep.faces as readonly string[]).includes(face))
  return { suggested, rest }
}

/**
 * The copyable reminder.
 *
 * Assembled from canonical strings only — the rep label, the boundary, the
 * container. Nothing the reader typed reaches it, and neither does any person's
 * name: Day 4 has no name field precisely so that this cannot happen.
 */
export function composeGrowUpReminder(input: {
  repKey: string | null
  where: string | null
  when: string | null
  boundary: string | null
  origin: string
}): string {
  const rep = findGrowUpRep(input.repKey)
  const parts = [`Day 4 rep — I will practise ${rep ? rep.label : 'the capacity I chose'}`]
  if (input.where) parts.push(input.where)
  if (input.when) parts.push(input.when)
  const head = `${parts.join(' ')}.`
  const guard = input.boundary ? ` I'll pause if ${input.boundary}.` : ''
  return `${head}${guard} · ${input.origin}/grow-up`
}

/** Chips on the receipt. Only what the reader actually did. */
export function growUpEvidence(input: {
  scope: GrowUpScope | null
  handoffs: number
  namedBelief: boolean
  carried: boolean
  hasRep: boolean
  hasBoundary: boolean
  container: boolean
}): string[] {
  const evidence = ['showed up to Day 4']
  if (input.scope && input.scope !== 'not_sure') evidence.push('named the hand I have')
  if (input.handoffs > 0) evidence.push(input.handoffs > 1 ? 'named the handoffs' : 'named the handoff')
  if (input.namedBelief) evidence.push('named the line in the way')
  if (input.carried) evidence.push('carried a Grow Up card')
  if (input.hasRep) evidence.push('chose one rep')
  if (input.hasBoundary) evidence.push('set a boundary')
  if (input.container) evidence.push('gave it a place to land')
  return evidence
}

export function growUpCheckUrl(origin: string): string {
  return `${origin}/grow-up`
}
