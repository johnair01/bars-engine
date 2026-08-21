/**
 * MTGOA Wake Up Check — Day 1 copy and the six unpacking questions (pure).
 *
 * Everything the flow says lives here so `WakeUpCheck.tsx` stays layout + state,
 * matching `src/lib/clean-up/check-content.ts`.
 *
 * Privacy invariant: Day 1 composes nothing outbound. The six answers are read
 * back to the visitor on the receipt and are never sent, stored, or copied into
 * a share draft — so no function in this module accepts free text at all.
 *
 * Source: MTGOA_30_DAY_COURSE_FOUNDATION_DAYS_1_TO_3_2026-08-19.md — "Day 1 —
 * Wake Up", the six unpacking questions. That note is the authority for wording.
 */

import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'

/** Which door the visitor came through. Decides the framing, not the questions. */
export type WakeUpRoute = 'book_promo' | 'own_practice'

/** How a question collects its answer. */
export type WakeUpQuestionKind = 'text' | 'choice'

export interface WakeUpQuestion {
  key: string
  number: number
  kind: WakeUpQuestionKind
  title: string
  body: string
  /** `text` questions only — the sentence stem the visitor continues. */
  placeholder?: string
  /** `choice` questions only. */
  choices?: readonly string[]
  /** Receipt label. Deliberately plainer than the question. */
  receiptLabel: string
}

/**
 * Q3's reading of the present. Three directions, no scoring — "stuck" is not
 * worse than "flowing," it is just what is true today.
 */
export const WAKE_UP_DIRECTIONS = [
  'flowing in the right direction',
  'stuck',
  'moving backward',
] as const

/**
 * The book's six self-sabotaging beliefs, in the order the book names them.
 * Days 1, 3 and 4 all present these six — a reader meets the same lines each
 * time, which is the course repeating itself on purpose.
 */
export const WAKE_UP_RESERVATIONS = [
  'I’m not good enough',
  'I’m not ready',
  'I don’t belong',
  'I’m insignificant',
  'I’m not worthy',
  'I’m not capable',
] as const

/**
 * The six unpacking questions, in order.
 *
 * Q5 has a specific job: saying what would have to be true makes the worldview
 * under the dissatisfaction visible. Q6 does not diagnose the reader; it surfaces
 * the reservation currently interrupting the move.
 */
export const WAKE_UP_QUESTIONS: readonly WakeUpQuestion[] = [
  {
    key: 'creation',
    number: 1,
    kind: 'text',
    title: 'What experience do you want to create?',
    body: 'What kind of allyship do you want to do, and who do you want to help? Name a real experience you want to create — something that would actually happen, with people in it.',
    placeholder: 'I want to…',
    receiptLabel: 'the creation',
  },
  {
    key: 'satisfaction',
    number: 2,
    kind: 'text',
    title: 'What will that get you?',
    body: 'If that experience existed, what satisfied emotion would it make available? Use your own word. This is about what becomes possible.',
    placeholder: 'It would let me feel…',
    receiptLabel: 'what it would get you',
  },
  {
    key: 'direction',
    number: 3,
    kind: 'choice',
    title: 'Compared to that, what’s life like right now?',
    body: 'Choose the direction that is closest. This is a reading of the present, and every direction here is a true answer.',
    choices: WAKE_UP_DIRECTIONS,
    receiptLabel: 'the current direction',
  },
  {
    key: 'dissatisfaction',
    number: 4,
    kind: 'text',
    title: 'How does it feel to live here?',
    body: 'Name the dissatisfied emotional state that is actually present. You can be plain; this is for your own contact with the situation.',
    placeholder: 'Living here feels…',
    receiptLabel: 'how it feels to live here',
  },
  {
    key: 'worldview',
    number: 5,
    kind: 'text',
    title: 'What would have to be true for someone to feel this way?',
    body: 'Let the worldview beneath the feeling speak. What condition, rule, risk, or history would make this feeling make sense? You are describing a view from the outside of it.',
    placeholder: 'For this to make sense, it would have to be true that…',
    receiptLabel: 'what would have to be true',
  },
  {
    key: 'reservation',
    number: 6,
    kind: 'choice',
    title: 'What reservations do you have about your creation?',
    body: 'One of these may be interrupting the move. It is a reservation to work with — the kind that loosens once you look straight at it.',
    choices: WAKE_UP_RESERVATIONS,
    receiptLabel: 'the reservation',
  },
] as const

export const WAKE_UP_QUESTION_KEYS = WAKE_UP_QUESTIONS.map((question) => question.key)

/** All 24 canonical Wake Up cards. Day 1 draws from the whole suit, never a subset. */
export const WAKE_UP_PRACTICES: MoveCard[] = assembleDeck('wake-up-check').cards.filter(
  (card): card is MoveCard => card.kind === 'move' && card.move === 'wake_up',
)

export const WAKE_UP_CARD_IDS = new Set(WAKE_UP_PRACTICES.map((card) => card.id))

/** Entry copy per door. The questions themselves do not change. */
export const WAKE_UP_OPENERS: Record<WakeUpRoute, { label: string; lead: string }> = {
  book_promo: {
    label: 'I want to help this book reach someone →',
    lead: 'Start with the allyship you actually want to do. The book is one way to do it.',
  },
  own_practice: {
    label: 'I’m working on my own allyship →',
    lead: 'Start with the allyship you actually want to do, whoever it is for.',
  },
}

export const WAKE_UP_EXPLAINER = [
  {
    num: '1',
    title: 'What you want, and what it would get you',
    body: 'Questions 1 and 2 name the experience you want to create and the satisfied feeling underneath it. That pair is the creation.',
  },
  {
    num: '2',
    title: 'Where you actually are',
    body: 'Questions 3 and 4 read the present honestly — the direction things are moving, and what it feels like to live there.',
  },
  {
    num: '3',
    title: 'What is holding the charge',
    body: 'Questions 5 and 6 surface the worldview beneath the feeling and the reservation narrowing the next move.',
  },
] as const

/** Receipt copy. Day 1's output is awareness — not a plan, a verdict, or a score. */
export const WAKE_UP_RECEIPT = {
  eyebrow: 'your Day 1 receipt',
  title: 'You made awareness.',
  body: 'You have a map of what you want to create, where you are, and what may be holding the charge. That is the whole job today. Nothing here is a plan you now owe anyone.',
  empty: 'You kept it all in your head. That still counts — the noticing is the thing.',
  closing: 'closing the tab is also a complete move.',
} as const

/** The chips on the receipt. Only what the visitor actually did. */
export function wakeUpEvidence(input: {
  answered: number
  drew: boolean
  carried: boolean
}): string[] {
  const evidence = ['showed up to Day 1']
  if (input.answered > 0) evidence.push(`unpacked ${input.answered} of 6`)
  if (input.drew) evidence.push('drew from the Wake Up suit')
  if (input.carried) evidence.push('carried a card')
  return evidence
}

export function wakeUpCheckUrl(origin: string): string {
  return `${origin}/wake-up`
}
