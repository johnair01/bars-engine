/**
 * Superpower deck generator — composes a complete 60-card grid for one superpower.
 * Spec: .specify/specs/superpower-move-decks/spec.md
 *
 * 60 = BasicMove (5) × Operation (6) × aspect (2). Domain-agnostic. Each card is
 * a `Technique` tagged superpowers:[sp], generated as status:'draft' (inert until
 * the author promotes it) — these are expansion-pack cards, never merged into the
 * base pool.
 */

import { MOVES } from '@/lib/allyship-deck/move-library'
import type { BasicMove, Operation, MoveAspect } from '../vocabulary'
import { MOVE_VALUES, OPERATION_VALUES } from '../vocabulary'
import type { Technique } from '../types'
import type { SuperpowerProfile } from './profiles'

/** Move → id abbreviation (WAKE/OPEN/…), from the canonical MOVES table. */
export const MOVE_ABBR: Record<BasicMove, string> = Object.fromEntries(
  MOVES.map((m) => [m.key, m.abbr]),
) as Record<BasicMove, string>

const ASPECTS: MoveAspect[] = ['inner', 'outer']

/** Level register: a one-word tag + a lens phrase, per operation altitude. */
const LEVELS: Record<Operation, { word: string; lens: string }> = {
  shaman: { word: 'Sense', lens: 'sensing what is here' },
  challenger: { word: 'Edge', lens: 'at the edge, naming what resists' },
  regent: { word: 'Steward', lens: 'stewarding it over time' },
  architect: { word: 'Structure', lens: 'building it into structure' },
  diplomat: { word: 'Bridge', lens: 'across difference and relationship' },
  sage: { word: 'Whole', lens: 'integrating the whole field' },
}

const MOVE_PROMPT: Record<BasicMove, string> = {
  wake_up: 'Notice what is actually here',
  open_up: 'Receive it without flinching',
  clean_up: 'Transform the charge',
  grow_up: 'Build the capacity',
  show_up: 'Take the concrete act',
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/** Deterministic id: `sp-<superpower>-<MOVE>-<OP>-<ASPECT>`. */
export function superpowerCardId(
  sp: SuperpowerProfile['key'],
  move: BasicMove,
  op: Operation,
  aspect: MoveAspect,
): string {
  return `sp-${sp}-${MOVE_ABBR[move]}-${op.toUpperCase()}-${aspect.toUpperCase()}`
}

/** Build the complete 60-card deck for a superpower. */
export function buildSuperpowerDeck(profile: SuperpowerProfile): Technique[] {
  const cards: Technique[] = []
  for (const move of MOVE_VALUES) {
    for (const op of OPERATION_VALUES) {
      for (const aspect of ASPECTS) {
        const row = profile.rows[move]
        const obj = aspect === 'inner' ? row.inner : row.outer
        const lvl = LEVELS[op]
        cards.push({
          id: superpowerCardId(profile.key, move, op, aspect),
          slug: `${profile.key}-${move}-${op}-${aspect}`,
          name: `${row.verb} ${obj} — ${lvl.word}`,
          essence: `${aspect === 'inner' ? 'In yourself' : 'For others'}: ${profile.giftShort}, ${lvl.lens}.`,
          steps: [
            `${MOVE_PROMPT[move]}, ${lvl.lens}.`,
            aspect === 'inner'
              ? `Practice it within: ${lowerFirst(obj)}.`
              : `Offer it to others: ${lowerFirst(obj)}.`,
            `Shadow check: ${profile.shadow}`,
          ],
          source: { origin: 'ai', name: 'Superpower deck generator (draft)' },
          moves: [move],
          operations: [op],
          domains: [],
          channels: [],
          aspect,
          superpowers: [profile.key],
          tier: 'canonical',
          status: 'draft',
        })
      }
    }
  }
  return cards
}
