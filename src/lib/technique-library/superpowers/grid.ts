/**
 * Superpower deck generator — composes a complete 60-card grid for one superpower.
 * Spec: .specify/specs/superpower-move-decks/spec.md + superpower-deck-quality (FR7)
 *
 * 60 = BasicMove (5) × Operation (6) × aspect (2). Domain-agnostic. Each card is
 * a `Technique` tagged superpowers:[sp], generated as status:'draft', origin:'ai'.
 *
 * Generated cards carry real L2 anatomy (a dual question, optimizesFor,
 * forbiddenMoves, failureModes, remediation, contraindications) composed from
 * move-level material + the superpower's gift/shadow. They stay below L3 (no
 * `tell`) and below L4 (origin 'ai' — not hand-authored). Hero cells (overrides,
 * origin 'gm') are the cell-specific L4 layer applied in decks.ts.
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

// ── Move-level anatomy (shared across superpowers; flavored by gift/shadow) ──
const MOVE_OPTIMIZES: Record<BasicMove, string> = {
  wake_up: 'Seeing what is actually there before reacting',
  open_up: 'Receiving the charge instead of bracing against it',
  clean_up: 'Metabolizing the charge so it stops leaking',
  grow_up: 'Building the capacity the work keeps asking for',
  show_up: 'Taking the one concrete act that moves things',
}
const MOVE_FORBIDDEN: Record<BasicMove, string> = {
  wake_up: 'Reacting before you have actually looked',
  open_up: 'Numbing or performing the feeling instead of feeling it',
  clean_up: 'Venting the charge onto someone else',
  grow_up: 'Forcing growth or skipping the rep',
  show_up: 'Hinting or prepping forever instead of acting',
}
const MOVE_FAILURE: Record<BasicMove, string> = {
  wake_up: "Blind spots you swear aren't there",
  open_up: 'Knowing without feeling',
  clean_up: 'The same charge, discharged again',
  grow_up: 'Busywork mistaken for growth',
  show_up: 'The move that never quite happens',
}
const MOVE_REMEDIATION: Record<BasicMove, string> = {
  wake_up: "Name one thing you hadn't let yourself see.",
  open_up: 'Let it land for one breath before you respond.',
  clean_up: 'Name what you are feeling out loud before you act.',
  grow_up: 'Pick one small rep and do it once.',
  show_up: 'Do the smallest real version today.',
}
const MOVE_INNER_Q: Record<BasicMove, string> = {
  wake_up: 'What am I not letting myself notice here?',
  open_up: 'What am I actually feeling, underneath?',
  clean_up: 'What charge am I carrying that needs to move?',
  grow_up: 'Who do I need to become for this?',
  show_up: 'What is the one act I keep avoiding?',
}
const MOVE_OUTER_Q: Record<BasicMove, string> = {
  wake_up: 'What does this situation need someone to see?',
  open_up: 'What is the other person or group really reaching for?',
  clean_up: 'What needs to be metabolized before we move together?',
  grow_up: 'What capacity does this work need us to build?',
  show_up: 'What concrete act would actually help right now?',
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
function upperFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
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

/** Build the complete 60-card deck for a superpower (L2 generated floor). */
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
            `${MOVE_PROMPT[move]} — ${lvl.lens}.`,
            aspect === 'inner' ? `Turn it inward: ${lowerFirst(obj)}.` : `Bring it to others: ${lowerFirst(obj)}.`,
          ],
          source: { origin: 'ai', name: 'Superpower deck generator (draft)' },
          moves: [move],
          operations: [op],
          domains: [],
          channels: [],
          aspect,
          superpowers: [profile.key],
          primaryQuestion: MOVE_INNER_Q[move],
          campaignQuestion: MOVE_OUTER_Q[move],
          optimizesFor: `${upperFirst(MOVE_OPTIMIZES[move])} — your ${profile.giftShort} at the ${lvl.word} level.`,
          forbiddenMoves: [MOVE_FORBIDDEN[move], `Sliding into ${profile.shadow}`],
          failureModes: [MOVE_FAILURE[move]],
          remediation: MOVE_REMEDIATION[move],
          contraindications: [`Overusing this becomes ${profile.shadow}`],
          tier: 'canonical',
          status: 'draft',
        })
      }
    }
  }
  return cards
}
