/**
 * Allyship Deck — Sales landing copy (pure data).
 *
 * Single source for the deck Sales page text: the five-move strip taglines, the
 * how-it-works steps, and the campaign social-proof figures. Kept out of JSX so the
 * numbers are honest-by-default — one place to update when the campaign moves.
 *
 * @see src/app/deck/sales/page.tsx
 * @see .specify/specs/allyship-deck-experience/spec.md (slice 4)
 */

import type { BasicMove } from '@/lib/allyship-deck/types'

/**
 * Campaign social proof. These are the figures reported by the crowdfunding campaign
 * (the design handoff's social-proof block). Update here when the campaign moves — the
 * page reads only from this constant, never from inline literals.
 */
export const DECK_SOCIAL_PROOF = {
  raisedDollars: 21_646,
  backers: 371,
} as const

/** One-line value prop for each of the five Basic Moves (Sales strip). */
export const MOVE_TAGLINES: Record<BasicMove, string> = {
  wake_up: "Notice what you'd rather not. Awareness is the first move.",
  open_up: 'Cross the threshold. Make room for what is unfamiliar.',
  clean_up: 'Repair the harm you carry. Clear the channel.',
  grow_up: 'Take responsibility. Build the capacity the moment needs.',
  show_up: 'Act in the open. Put your body where your values are.',
}

/** Display order of the moves on the Sales strip (the developmental arc). */
export const MOVE_STRIP_ORDER: readonly BasicMove[] = [
  'wake_up',
  'open_up',
  'clean_up',
  'grow_up',
  'show_up',
]

export interface HowItWorksStep {
  n: number
  title: string
  body: string
}

/** The three-beat loop the deck app delivers (Draw → Practice → Send to BARS). */
export const HOW_IT_WORKS: readonly HowItWorksStep[] = [
  {
    n: 1,
    title: 'Draw a card',
    body: 'Pull one of 120 moves at random, browse the deck, or find the card for the problem in front of you.',
  },
  {
    n: 2,
    title: 'Sit with the practice',
    body: 'Every card holds a real question and a concrete practice to run — for yourself or for a campaign.',
  },
  {
    n: 3,
    title: 'Send it to BARS',
    body: 'Turn the card into a quest: capture the emotional charge, then take the 3·2·1 action it asks of you.',
  },
]
