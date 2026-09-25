/**
 * MTGOA Show Up Check — Day 5 copy and the handoff vocabulary (pure).
 *
 * Everything the flow says lives here so `ShowUpCheck.tsx` stays layout + state,
 * matching `src/lib/clean-up/check-content.ts` and `src/lib/wake-up/check-content.ts`.
 *
 * Authority: MTGOA_DAYS_1_TO_5_HOSTILE_REVIEW_2026-08-21.md. That review settled
 * six decisions this module encodes rather than restates:
 *
 *  1. Prepared is not completed. Three distinct states, named separately.
 *  2. No-send is data. It forks on "unclear inside me" vs "not the right hand".
 *  3. A sale is an outcome, never the reader's moral score.
 *  4. The course cannot claim memory it does not have.
 *  5. A card interrupts a habitual answer; it never diagnoses.
 *  6. Every handoff needs a recipient-centered reason apart from conversion.
 *
 * Privacy invariant: like Day 1, Day 5 composes nothing outbound from free text.
 * The handoff a reader writes is theirs to send from their own tool; the page
 * only ever offers canonical strings back to them.
 */

import { SHOW_UP_RAISE_AWARENESS_PRACTICES } from '@/lib/mtgoa-course/course-days'
import type { MoveCard } from '@/lib/allyship-deck/types'

/**
 * The Day 5 core object, approved in the review before any page copy:
 *
 * > one consentful, specific artifact or contact that gives a particular person
 * > or room a truthful reason to encounter the book, while leaving them free to
 * > decline.
 */
export const SHOW_UP_CORE_OBJECT =
  'One consentful, specific handoff that gives a particular person a truthful reason to encounter the book — and leaves them free to decline.'

/**
 * The three states, kept distinct on purpose. `prepared` is never called
 * completed: Show Up's output is an artifact someone can receive, not an
 * intention, and a page that rewards a polished draft teaches the private-clarity
 * loop the Challenger card exists to interrupt.
 */
export type ShowUpState = 'prepared' | 'shown_up' | 'put_down'

/** Why a handoff did not get made. The fork that keeps no-send from meaning failure. */
export type ShowUpBlockKind = 'inside_me' | 'not_this_hand'

/** All 24 Show Up cards exist; Day 5 narrows to round 1's six, like Day 4. */
export const SHOW_UP_PRACTICES: MoveCard[] = SHOW_UP_RAISE_AWARENESS_PRACTICES

export const SHOW_UP_CARD_IDS = new Set(SHOW_UP_PRACTICES.map((card) => card.id))

/** The course-level design rule, stated on both narrowed days. */
export { MTGOA_DOMAIN_RULE as SHOW_UP_DOMAIN_RULE } from '@/lib/mtgoa-course/course-days'

/** One channel, one room — Shaman's job. "Spread the word" is not a channel. */
export const SHOW_UP_CHANNELS = [
  { key: 'in_person', label: 'in person' },
  { key: 'call', label: 'on a call' },
  { key: 'dm', label: 'by text or DM' },
  { key: 'email', label: 'by email' },
  { key: 'group', label: 'in a group chat' },
  { key: 'post', label: 'in a post' },
] as const

/** What actually changes hands. An artifact someone can receive, not an intention. */
export const SHOW_UP_ARTIFACTS = [
  { key: 'passage', label: 'a passage that made me think of them', short: 'a passage' },
  { key: 'question', label: 'a question the book asked me that they are living', short: 'a question' },
  { key: 'practice', label: 'one practice from the book they could use this week', short: 'a practice' },
  { key: 'chapter', label: 'the free first chapter', short: 'chapter one' },
  { key: 'why', label: 'the honest reason it landed for me', short: 'my reason' },
  { key: 'book', label: 'the book itself', short: 'the book' },
] as const

/**
 * Recipient-centered reasons — the review's non-negotiable 6. Every one of these
 * is true whether or not the recipient ever buys anything. That is the test.
 */
export const SHOW_UP_REASONS = [
  { key: 'live_question', label: 'They are already sitting with this exact question.' },
  { key: 'language', label: 'It gives them language for something they have been describing the long way around.' },
  { key: 'not_alone', label: 'It would show them other people find this hard too.' },
  { key: 'practice', label: 'There is one practice in it they could use this week, for free.' },
  { key: 'asked', label: 'They asked me for something like this.' },
  { key: 'own_words', label: 'Something else — in my own words.' },
] as const

/**
 * Timing options. A target and a time, but no urgency theater: "say the thing
 * today" must not override a reader's actual energy or the relationship's terms.
 */
export const SHOW_UP_TIMINGS = [
  { key: 'now', label: 'right now, while it is clear' },
  { key: 'today', label: 'today' },
  { key: 'week', label: 'this week' },
  { key: 'next_time', label: 'the next time we actually talk' },
  { key: 'when_right', label: 'when it is actually the right moment' },
] as const

/**
 * Per-card guidance. Each translates its Game Master's operation into the one
 * thing this card asks of a handoff — never a description of the reader.
 *
 * The Diplomat line carries the review's failure-risk-3 correction: a promoter
 * cannot borrow the authority of people affected by a harm, so with no consented
 * voice to amplify the honest move is to speak from your own experience.
 */
export const SHOW_UP_CARD_PROMPTS: Record<string, string> = {
  'SHOW-RA-SHAMAN': 'Aim it at one person or one room, through one channel.',
  'SHOW-RA-CHALLENGER': 'Say the actual sentence, in the words you would use out loud.',
  'SHOW-RA-REGENT': 'Choose something you can repeat, and that leaves them free to answer or let it sit.',
  'SHOW-RA-ARCHITECT': 'Make it reusable — something you could send again without rebuilding it.',
  'SHOW-RA-DIPLOMAT': 'If you have a consented voice to amplify, center it. Otherwise speak from your own experience and name the source, leaving other people’s stories theirs to tell.',
  'SHOW-RA-SAGE': 'Leave something that outlasts the moment: a record, a passage, a thing they can return to.',
}

/** The two honest readings of "I did not send it." Neither is a failure. */
export const SHOW_UP_BLOCKS: ReadonlyArray<{ key: ShowUpBlockKind; label: string; body: string }> = [
  {
    key: 'inside_me',
    label: 'The next move is unclear inside me.',
    body: 'Something earlier in the loop is unfinished. That is what the first four days are for, and finding it here is the practice working.',
  },
  {
    key: 'not_this_hand',
    label: 'This is not the right hand, relationship, or moment.',
    body: 'That is a real reading of the field. There may be no right recipient today, or this book may be the wrong thing for this person.',
  },
]

/** Where an "unclear inside me" answer sends a reader. Days, not a diagnosis. */
export const SHOW_UP_EARLIER_MOVES = [
  { day: 1, key: 'wake_up', label: 'Wake Up', why: 'I am not sure what I actually want to create.' },
  { day: 2, key: 'open_up', label: 'Open Up', why: 'There is too much charge around it to move.' },
  { day: 3, key: 'clean_up', label: 'Clean Up', why: 'A story is making the move look bigger than it is.' },
  { day: 4, key: 'grow_up', label: 'Grow Up', why: 'I do not yet have the capacity this asks for.' },
] as const

/** Where a "not this hand" answer goes. None of these is a failure label. */
export const SHOW_UP_PUT_DOWN_OPTIONS = [
  'Choose a different person or room.',
  'Choose a different thing to hand over.',
  'Put this one down. “Not this” is reason enough.',
] as const

export const SHOW_UP_RECEIPT = {
  shown_up: {
    eyebrow: 'your Day 5 receipt',
    title: 'You made a handoff.',
    body: 'Something left your hands and can be received. Whether they take it up is theirs to decide, and yours to let go of.',
  },
  prepared: {
    eyebrow: 'your Day 5 receipt',
    title: 'It is built, and still in your hands.',
    body: 'Prepared is a real thing to have made. The handoff is still waiting on you, whenever the moment is right.',
  },
  put_down: {
    eyebrow: 'your Day 5 receipt',
    title: 'You read the field and held it back.',
    body: 'Holding back can be the accurate read. Every relationship gets to stay whatever it already is.',
  },
  closing: 'closing the tab is also a complete move.',
} as const

/**
 * The Come Back prompt. Reflection after the loop, not a sixth Basic Move — and
 * with no persistence, the page must not pretend to remember anything.
 */
export const SHOW_UP_COME_BACK = {
  title: 'What happened, or what stopped you?',
  body: 'This is the part the course is actually for. Contact teaches something a plan cannot.',
  reentry: 'Returning to this? Start with what happened when you made contact — or with what stopped you.',
  noMemory: 'This page starts fresh every time. Everything you wrote stayed in your browser.',
} as const

/** Chips on the receipt. Only what the reader actually did. */
export function showUpEvidence(input: {
  aimed: boolean
  carried: boolean
  hasReason: boolean
  state: ShowUpState | null
  returned: boolean
}): string[] {
  const evidence = ['showed up to Day 5']
  if (input.aimed) evidence.push('aimed it at one room')
  if (input.carried) evidence.push('carried a Show Up card')
  if (input.hasReason) evidence.push('named what it gives them')
  if (input.state === 'shown_up') evidence.push('made the handoff')
  if (input.state === 'prepared') evidence.push('prepared it')
  if (input.state === 'put_down') evidence.push('read the field, put it down')
  if (input.returned) evidence.push('named what happened')
  return evidence
}

/**
 * Whether a reader may claim they made a useful handoff.
 *
 * The review's failure risk 1 is a recommendation package masquerading as help,
 * and its required change is a routing rule: a handoff that cannot say what it
 * gives the recipient apart from a purchase should send the reader to an earlier
 * move or another hand instead. So this gates one claim — not the reader's
 * progress. Preparing, putting it down, and reaching the receipt all stay open.
 */
export function canClaimHandoff(hasRecipientReason: boolean): boolean {
  return hasRecipientReason
}

export function showUpCheckUrl(origin: string): string {
  return `${origin}/show-up`
}
