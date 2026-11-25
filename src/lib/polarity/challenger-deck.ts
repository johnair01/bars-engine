/**
 * The Challenger's polarity deck: 4 quadrant pairs x 2 poles x 4 moves = 32 cards (BIPD FR-006, FR-007).
 * Only the Shielding pole is live for a new player; all eight It cards (Shielding and Sparring) have wording. The Sparring pole opens beside it for a player whose kept acts
 * turn them (see standing.ts). A card is data; nothing here counts or deals.
 */

export type Move = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
export type Quadrant = 'I' | 'It' | 'We' | 'Its'

export const MOVES: readonly Move[] = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

export interface PolarityCard {
  id: string
  quadrant: Quadrant
  /** The pole this card sits on, e.g. 'Shielding'. */
  pole: string
  /** The other pole of the same pair. */
  otherPole: string
  move: Move
  /** Null until a prompt is written; a sealed card shows its title and no prompt. */
  prompt: string | null
  /** What bringing back a BAR redeems: the card asks for a future act, and the BAR of that act redeems it. Null while the prompt is null. */
  redeem: string | null
  /** Grow Up cards credit a named book; the book is still to pick. */
  note?: string
}

export const CHALLENGER_PAIRS: Record<Quadrant, readonly [string, string]> = {
  I: ['Daring', 'Guarding'],
  It: ['Sparring', 'Shielding'],
  We: ['Glory', 'Comradeship'],
  Its: ['Challenge ladder', 'Shield wall'],
}

/** The pole a new player holds, per the ruling that Shielding is the first playable pole. */
export const FIRST_POLE = 'Shielding'

/**
 * Cards prompt future action and are redeemed by taking it (Wendell, 2026-11-16, bar-decks-sparring-wake-2 = A).
 * Never a look-back question, never an assumed opponent or past shield. Redeemed means a BAR of the act is kept.
 */
interface CardWording {
  prompt: string
  redeem: string
}

const SHIELDING_WORDING: Record<Move, CardWording> = {
  wakeUp: {
    prompt: 'The next time someone near you gets talked over, step in before anyone asks you to.',
    redeem: 'Redeemed when you bring back a BAR of what you did.',
  },
  cleanUp: {
    prompt: 'Pick one task you usually carry for someone. This week, let them carry it, and stay close without stepping in.',
    redeem: 'Redeemed when you bring back a BAR of what happened.',
  },
  growUp: {
    prompt: 'Ask one person you look out for what they could carry on their own.',
    redeem: 'Redeemed when you bring back a BAR of what they say.',
  },
  showUp: {
    prompt: 'Ask someone you care about where they want you beside them, then be there.',
    redeem: 'Redeemed when you bring back a BAR of being there.',
  },
}

/** The partner set (Wendell, 2026-11-16, bar-decks-sparring-moves-1 = A). */
const SPARRING_WORDING: Record<Move, CardWording> = {
  wakeUp: {
    prompt: 'Choose one skill you want to get better at. This week, find someone who does it well and ask them to push you on it.',
    redeem: 'Redeemed when you bring back a BAR of what they pushed on.',
  },
  cleanUp: {
    prompt: 'The next time someone pushes back on you, wait one breath before you answer, and ask them to say more.',
    redeem: 'Redeemed when you bring back a BAR of what they said once you let them finish.',
  },
  growUp: {
    prompt: 'Pick the skill you are working on and set yourself a test you could fail this week. Tell one person, so they can hold you to it.',
    redeem: 'Redeemed when you bring back a BAR of the result, pass or fail.',
  },
  showUp: {
    prompt: 'Offer to push someone else on a skill they want to get better at, and do it fairly.',
    redeem: 'Redeemed when you bring back a BAR of what you pushed on.',
  },
}

function wordingFor(quadrant: Quadrant, pole: string, move: Move): CardWording | null {
  if (quadrant !== 'It') return null
  if (pole === 'Shielding') return SHIELDING_WORDING[move]
  if (pole === 'Sparring') return SPARRING_WORDING[move]
  return null
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function buildChallengerDeck(): PolarityCard[] {
  const cards: PolarityCard[] = []
  for (const quadrant of Object.keys(CHALLENGER_PAIRS) as Quadrant[]) {
    const pair = CHALLENGER_PAIRS[quadrant]
    for (const pole of pair) {
      const otherPole = pair[0] === pole ? pair[1] : pair[0]
      for (const move of MOVES) {
        const wording = wordingFor(quadrant, pole, move)
        cards.push({
          id: `challenger-${quadrant.toLowerCase()}-${slug(pole)}-${move}`,
          quadrant,
          pole,
          otherPole,
          move,
          prompt: wording?.prompt ?? null,
          redeem: wording?.redeem ?? null,
          ...(move === 'growUp' ? { note: '(book to name)' } : {}),
        })
      }
    }
  }
  return cards
}

export const CHALLENGER_DECK: readonly PolarityCard[] = buildChallengerDeck()
