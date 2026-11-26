/**
 * A player's standing on a pole pair, worked out from the BARs they kept (BIPD Phase 4, Wendell 2026-11-16,
 * bar-decks-unseal-2 = A: "Opens beside, for that player").
 *
 * - A move is what the player does; a pole is where the player stands. Any move can be played on either pole.
 * - A standing turns only after many kept acts, never after one. Each pole builds its own count.
 * - The turn is one-way and opens the other pole BESIDE the one the player holds, for that player only.
 * - The count stays hidden: nothing here returns one. The player sees a card turn up in their hand.
 * - A kept act's card stays in the deck.
 *
 * The standing is derived from the kept acts, so it needs no new column or table.
 */
import { CHALLENGER_DECK, FIRST_POLE, type Move, type PolarityCard } from './challenger-deck'

/**
 * PLACEHOLDER, NOT RULED. The number of kept acts that turns a standing waits on a short paper walk with three
 * playtesters (Challenger report, part 4). Change it here and nowhere else. Never ship it as a decided value.
 */
export const TURN_AFTER_KEPT = 5

/**
 * Open question on the board (his next question): does a move played from the other pole count toward the turn?
 * Until he rules, an act counts toward the pole whose card it was played on, and only that one.
 */
export const OTHER_POLE_COUNTS = false

export interface KeptAct {
  barId: string
  /** The pole of the card the act was played from. */
  pole: string
  move: Move
  at: string
}

export interface Standing {
  /** Poles that are live for this player, in the order they opened. The first is the pole they hold. */
  opened: string[]
}

export interface PairSides {
  held: string
  other: string
}

export const CHALLENGER_IT_PAIR: PairSides = { held: FIRST_POLE, other: 'Sparring' }

/** Kept acts on a pole; internal, never shown to the player. */
function tally(acts: readonly KeptAct[], pole: string, pair: PairSides, otherCounts: boolean): number {
  return acts.filter((a) => a.pole === pole || (otherCounts && (a.pole === pair.held || a.pole === pair.other))).length
}

/**
 * Where a player stands. The held pole is always open. The other pole opens once the kept acts on the held pole
 * reach TURN_AFTER_KEPT, and stays open (one-way). `threshold` and `otherCounts` default to the named settings.
 */
export function standingFor(
  acts: readonly KeptAct[],
  pair: PairSides = CHALLENGER_IT_PAIR,
  threshold: number = TURN_AFTER_KEPT,
  otherCounts: boolean = OTHER_POLE_COUNTS,
): Standing {
  const opened = [pair.held]
  if (tally(acts, pair.held, pair, otherCounts) >= threshold) opened.push(pair.other)
  return { opened }
}

/** A card is live for a player when its pole is open for them. */
export function isLive(card: PolarityCard, standing: Standing): boolean {
  return standing.opened.includes(card.pole)
}

/** The cards in a player's hand pool: live for them, whatever move. Kept cards are never removed. */
export function liveCards(standing: Standing, deck: readonly PolarityCard[] = CHALLENGER_DECK): PolarityCard[] {
  return deck.filter((c) => isLive(c, standing))
}

/** The line the hand shows when a pole turns up. No number, no "unlocked". */
export const TURN_LINE = 'Sparring turns up in your hand.'

/**
 * What the keep path reports after a BAR is kept: the new standing, and the card to turn up if a pole just opened
 * (the other pole's Wake Up card, the polarity interview). `turned` is null when nothing turned.
 */
export function keepAct(
  acts: readonly KeptAct[],
  act: KeptAct,
  pair: PairSides = CHALLENGER_IT_PAIR,
  deck: readonly PolarityCard[] = CHALLENGER_DECK,
): { standing: Standing; turned: { line: string; card: PolarityCard } | null } {
  const before = standingFor(acts, pair)
  const standing = standingFor([...acts, act], pair)
  const newlyOpened = standing.opened.filter((p) => !before.opened.includes(p))
  if (newlyOpened.length === 0) return { standing, turned: null }
  const card = deck.find((c) => c.quadrant === 'It' && c.pole === newlyOpened[0] && c.move === 'wakeUp')
  return { standing, turned: card ? { line: TURN_LINE, card } : null }
}
