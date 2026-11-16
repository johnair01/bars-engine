/**
 * The Challenger's polarity deck: 4 quadrant pairs x 2 poles x 4 moves = 32 cards (BIPD FR-006, FR-007).
 * Only the Shielding pole is live for a new player. The Sparring pole opens beside it for a player whose kept acts
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

// Keep the card's current wording (bar-decks-shielding-wording-1 is still unpicked).
const SHIELDING_PROMPTS: Record<Move, string> = {
  wakeUp: 'Whom did you stand in front of today without being asked? Do it, then capture what happened as a BAR.',
  cleanUp: 'Where did your standing in front of someone cost them or you something? Name it, then capture it as a BAR.',
  growUp: 'Ask someone you shielded what they could have carried themselves. Capture what you hear as a BAR.',
  showUp: 'Stand in front of someone who asked you to. Do it, then capture what happened as a BAR.',
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
        const isShieldingIt = quadrant === 'It' && pole === 'Shielding'
        cards.push({
          id: `challenger-${quadrant.toLowerCase()}-${slug(pole)}-${move}`,
          quadrant,
          pole,
          otherPole,
          move,
          prompt: isShieldingIt ? SHIELDING_PROMPTS[move] : null,
          ...(move === 'growUp' ? { note: '(book to name)' } : {}),
        })
      }
    }
  }
  return cards
}

export const CHALLENGER_DECK: readonly PolarityCard[] = buildChallengerDeck()
