/**
 * MTGOA Week 3 — Gather Resources, Days 11–15 (pure).
 *
 * Week 3 narrows to the Deck's `GATHERING_RESOURCES` domain, so every day draws
 * from its move's six `*-GR-*` cards.
 *
 * Only Day 11 is authored. The other four rows are deliberately absent rather
 * than stubbed: `course-days.ts` marks anything unlisted `unauthored`, which is
 * what keeps a forward handoff from pointing at a route that does not resolve.
 *
 * Day 11's copy outgrew a table row the way Days 6, 8, 9 and 10 did, so it lives
 * in `day-eleven.ts` and `DayElevenStartingHand` renders it. The row here still
 * owns the route contract, the metadata, and this day's reading of its six cards.
 *
 * Authority: .specify/specs/mtgoa-day11-starting-hand/design_handoff/
 *
 * Privacy invariant: nothing composed on a Week 3 day leaves the browser.
 */

import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'
import type { MtgoaCourseMove } from './course-days'

export type RoundThreeDay = {
  day: number
  move: MtgoaCourseMove
  slug: string
  /** The move's Week 3 title, e.g. "What is already in your hand?". */
  title: string
  coreQuestion: string
  entry: string
  /** Per-card translation: what this Game Master asks of *this* day. */
  cardPrompts: Record<string, string>
  drawTitle: string
  drawBody: string
  /** What this day must not turn into. Kept as copy, not just a note to us. */
  doNot: string
}

/** Week 3's domain. Every day draws from its move's six `*-GR-*` cards. */
export const ROUND_THREE_DOMAIN = 'GATHERING_RESOURCES' as const

export const ROUND_THREE_PROMISE =
  'Gather Resources starts with seeing. Week 3 is about what you can already reach, named honestly enough to be worth counting.'

const DECK = assembleDeck()

export const ROUND_THREE_DAYS: readonly RoundThreeDay[] = [
  {
    day: 11,
    move: 'wake_up',
    slug: 'wake-up',
    title: 'What is already in your hand?',
    coreQuestion: 'What can I actually reach?',
    entry:
      'You are waiting to feel influential. You are already holding something — people who ask what you think, rooms you belong to, problems you recognise on sight. Today counts them, before you decide whether any of it moves.',
    drawTitle: 'Three from the Gather Resources hand',
    drawBody:
      'Six Wake Up cards read the resource field. Three are dealt. Carrying one is optional.',
    cardPrompts: {
      'WAKE-GR-SHAMAN': 'Which line of your ledger has actually run down to nothing?',
      'WAKE-GR-CHALLENGER': 'Which line have you left off the page so far?',
      'WAKE-GR-REGENT': 'Which line would you back with your own name?',
      'WAKE-GR-ARCHITECT': 'Which resource is sitting unused because nobody has asked you for it?',
      'WAKE-GR-DIPLOMAT': 'Whose yes stands between a line on this ledger and its being real?',
      'WAKE-GR-SAGE': 'What story does your sense of scarcity tell about you?',
    },
    doNot: 'A count of what you can reach.',
  },
]

export function roundThreeCardsFor(move: MtgoaCourseMove): MoveCard[] {
  return DECK.cards.filter(
    (card): card is MoveCard =>
      card.kind === 'move' && card.move === move && card.domain === ROUND_THREE_DOMAIN,
  )
}

export function roundThreeDay(day: number): RoundThreeDay | null {
  return ROUND_THREE_DAYS.find((d) => d.day === day) ?? null
}

export function roundThreeDayByMove(move: MtgoaCourseMove): RoundThreeDay | null {
  return ROUND_THREE_DAYS.find((d) => d.move === move) ?? null
}
