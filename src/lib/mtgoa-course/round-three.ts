/**
 * MTGOA Week 3 — Gather Resources, Days 11–15 (pure).
 *
 * Week 3 narrows to the Deck's `GATHERING_RESOURCES` domain, so every day draws
 * from its move's six `*-GR-*` cards.
 *
 * Days 11–14 are authored. The last row (Day 15) is deliberately absent rather
 * than stubbed: `course-days.ts` marks anything unlisted `unauthored`, which is
 * what keeps a forward handoff from pointing at a route that does not resolve.
 *
 * Days 11–14 have their own components and copy modules. The rows here
 * own their route contracts, metadata, and readings of their six cards.
 *
 * Authority: .specify/specs/mtgoa-day11-starting-hand/design_handoff/ (Day 11),
 * .specify/specs/mtgoa-day13-resourcing-321/design_handoff/ (Day 13)
 *
 * Privacy invariant: nothing composed on a Week 3 day leaves the browser,
 * except the explicit Day 11 email-app handoff the reader elects to open. Day 13
 * keeps its 3-2-1 pass in `localStorage` while the practice is open and clears it
 * at the receipt — the same on-device bend Day 8 made, never a network write.
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
  {
    day: 12,
    move: 'open_up',
    slug: 'open-up',
    title: 'Hold the Resource Question',
    coreQuestion: 'What happens when this resource needs to move?',
    entry:
      'Yesterday you named what is in reach. Today, pick one resource question and notice what changes when it could actually move between people.',
    drawTitle: 'Six ways to stay closer to the question',
    drawBody:
      'Six Open Up cards receive the resource question. Three are dealt. Carrying one is optional.',
    cardPrompts: {
      'OPEN-GR-SHAMAN': 'Where does the lack, offer, or need register before you reach for a plan?',
      'OPEN-GR-CHALLENGER': 'What changes when you let the real ask be a real sentence?',
      'OPEN-GR-REGENT': 'Can you hold this question for one minute without making it an emergency or abandoning it?',
      'OPEN-GR-ARCHITECT': 'Is there a resource you are allowed to receive before you ask for something new?',
      'OPEN-GR-DIPLOMAT': 'What choice, consent, or clean boundary would let this resource move without scorekeeping?',
      'OPEN-GR-SAGE': 'What becomes visible when you stop trying to force this question closed?',
    },
    doNot: 'A decision about what you owe.',
  },
  {
    day: 13,
    move: 'clean_up',
    slug: 'clean-up',
    title: 'Let the resourcing part speak',
    coreQuestion: 'What move is missing when a resource has to move?',
    entry:
      'Day 11 counted what is in reach. Day 12 held one resource question. Today, take the part of you that gets loud the moment a resource has to move — the one that would rather cover it quietly than ask, or that treats one more request as a debt. Let it describe the job before you try to fix how you resource anything.',
    drawTitle: 'Three from the Gather Resources hand',
    drawBody:
      'Six Clean Up cards read the charge around resourcing. Three are dealt. Carrying one is optional.',
    cardPrompts: {
      'CLEAN-GR-SHAMAN': 'Which feeling is running the money here — fear, anger, sadness, numbness, or reach?',
      'CLEAN-GR-CHALLENGER': 'Which story about deserving or scarcity are you treating as a fact?',
      'CLEAN-GR-REGENT': 'Which capability is offline — to ask, to receive, to rest, to let it be enough?',
      'CLEAN-GR-ARCHITECT': 'If you moved this charge, would you transcend it, translate it, or set it down?',
      'CLEAN-GR-DIPLOMAT': 'Which feeling would the ask come from if it served the other person?',
      'CLEAN-GR-SAGE': 'What does this shortfall teach you that you get to keep?',
    },
    doNot: 'A plan for how to resource the work.',
  },
  {
    day: 14,
    move: 'grow_up',
    slug: 'grow-up',
    title: 'Give one resourcing capacity a rep',
    coreQuestion: 'Which resourcing capacity deserves one real rep?',
    entry:
      'Day 13 named the move you keep skipping around resources. Today you do not fix all of it. You pick one resourcing capacity — asking, receiving, stewarding, resting — and give it a single rep, one notch bigger than today. A capacity grows by being used once more than it was yesterday, not by being replaced.',
    drawTitle: 'Six ways a capacity grows',
    drawBody:
      'Six Grow Up cards read the resourcing edge. Three are dealt. Carrying one is optional.',
    cardPrompts: {
      'GROW-GR-SHAMAN': 'Which resourcing capacity is already trying to grow in you?',
      'GROW-GR-CHALLENGER': 'What is the edge — the ask or the stewardship one level past comfortable?',
      'GROW-GR-REGENT': 'Which resourcing skill is worth repeating until it is reliable?',
      'GROW-GR-ARCHITECT': 'Which capability you already have would unlock the most if you strengthened it?',
      'GROW-GR-DIPLOMAT': 'As this grows, how does it land on the people around you?',
      'GROW-GR-SAGE': 'Who are you becoming as you learn to gather and steward?',
    },
    doNot: 'A whole new skill by Friday.',
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
