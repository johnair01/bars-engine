/**
 * The Council Board card, mirrored from six-faces-council schema/card.schema.json (an identical copy is
 * fixtures/council-card/card.schema.json; src/lib/board/__tests__/card.test.ts fails when the enums here drift from it).
 * Wendell's spec docs/specs/council-board-v2.md section 1 (2026-10-30), open decision 1 (position bv2-home): the card
 * shapes are shared BARs Engine objects and the board stays in the council. A card rides on a council row as `card`.
 * Types only: nothing here is stored in Postgres or needs a migration. The spec's validation rules (a why naming a
 * person, no paths or ids on the front, the missing thing named, one recommended move) run in the council's
 * board/card_check.py on every landing path.
 *
 * Engine objects: State = project, face, standard, front.why; Transition = front.next_step; Move = front.moves (three,
 * never more); Commitment = commitment (a pressed move, due in one round); Outcome = outcome; BAR = bar (compost);
 * Ruling = inside.rulings.
 */
export const CARD_FACES = ['shaman', 'architect', 'challenger', 'regent', 'diplomat', 'sage'] as const
export const CARD_MOVES = ['claude_takes_it', 'steer', 'compost'] as const
export const CARD_MECHANICS = ['dispatch-lever', 'steer-helm', 'compost-hatch'] as const
export const CARD_CHANNELS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
export const MISSING_KINDS = ['decision', 'reference', 'feeling', 'approval'] as const
/** Spec section 5: the fixed list a compost BAR picks its stall reason from. */
export const STALLS = ['missing_context', 'wrong_mechanic', 'lost_charge', 'superseded', 'too_big', 'blocked_outside'] as const
export const OUTCOME_RESULTS = ['shipped', 'stopped', 'steered', 'composted'] as const

export type CardFace = (typeof CARD_FACES)[number]
export type CardMoveName = (typeof CARD_MOVES)[number]

export interface CardMove {
  move: CardMoveName
  label: string
  recommended: boolean
  mechanic?: (typeof CARD_MECHANICS)[number]
}
export interface CardMissing { kind: (typeof MISSING_KINDS)[number]; text: string }
export interface ReadReceipt { read: string[]; acceptance: string; standard: string; not_understood: string[]; at: string; by?: string }
export interface Ruling { question: string; answer: string; project?: string; date: string; rule?: string; id?: string }
export interface Charge { channels: (typeof CARD_CHANNELS)[number][]; at?: string; satisfied?: 'satisfied' | 'dissatisfied' | 'neutral' }
export interface Commitment { move: CardMoveName; at: string; due: 'one round'; receipt_required?: boolean }
export interface Outcome { at: string; result: (typeof OUTCOME_RESULTS)[number]; text?: string }
export interface CompostBar { tried: string; stall: (typeof STALLS)[number]; salvage?: string; feeds?: string; lesson?: string }

export interface Card {
  project: string
  face: CardFace
  standard?: string
  front: {
    why: string
    why_person: string
    next_step: string
    missing: CardMissing | null
    /** Exactly claude_takes_it, steer, compost in that order, exactly one recommended. */
    moves: [CardMove, CardMove, CardMove]
  }
  /** Deck and face only; drawn with no words. */
  back: { deck: string; face: CardFace }
  inside: {
    spec?: string
    files?: string[]
    acceptance?: string[]
    receipt?: ReadReceipt | null
    rulings?: Ruling[]
    charge?: Charge | null
    tokens?: { spent: number; budget?: number | null }
    source?: string
  }
  commitment?: Commitment | null
  outcome?: Outcome | null
  bar?: CompostBar | null
}
