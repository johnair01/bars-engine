/**
 * Allyship Deck — Expression Register (the Witness Turn).
 *
 * Resolves the inner/outer tension: inner work, honestly expressed, IS an outer awareness
 * move. A card raises awareness in one of two registers, derived deterministically from the
 * move (no AI; faces modulate style, not content):
 *   - 'point'   — make an EXTERNAL truth visible ("here is what's unseen / must change").
 *   - 'witness' — make your HONEST INNER PROCESS visible ("here is what this surfaced in me").
 *
 * Point-native = the outward moves (see it / say it). Witness-native = the metabolizing moves
 * (receive / develop). Clean Up is the hinge: it metabolizes a charge (Witness) but can also
 * surface a pointable insight (Point).
 *
 * Design:   docs/ontology/2026-07-12-the-witness-turn-inner-outer-resolution.md
 * Polarity: docs/VALUES_AND_POLARITIES.md — Honesty ↔ Craft governs HOW a register is expressed.
 *
 * Pure data + pure functions. No I/O, no render — tsx-testable.
 */
import type { BasicMove, ExpressionRegister, MoveCard } from './types'

export interface MoveExpression {
  /** The move's native/default register — how it most naturally raises awareness. */
  primary: ExpressionRegister
  /** Every register the move can legitimately be expressed in (primary included). */
  affords: ExpressionRegister[]
}

/**
 * Move → expression register. The awareness-content direction of each WAVE move:
 *   wake  = see it            → Point (external truth), can also witness one's own noticing
 *   open  = receive/feel it   → Witness only (reception is inherently first-person)
 *   clean = metabolize it     → Witness (your charge/story), can also Point a surfaced insight
 *   grow  = develop it        → Witness only (becoming is inherently first-person)
 *   show  = express/act on it → Point (artifact/action), can also carry a witness-artifact
 */
export const MOVE_EXPRESSION: Record<BasicMove, MoveExpression> = {
  wake_up: { primary: 'point', affords: ['point', 'witness'] },
  open_up: { primary: 'witness', affords: ['witness'] },
  clean_up: { primary: 'witness', affords: ['witness', 'point'] },
  grow_up: { primary: 'witness', affords: ['witness'] },
  show_up: { primary: 'point', affords: ['point', 'witness'] },
}

/** The register a move raises awareness in by default. */
export function primaryRegisterForMove(move: BasicMove): ExpressionRegister {
  return MOVE_EXPRESSION[move].primary
}

/** Every register a move can legitimately be expressed in. */
export function registersForMove(move: BasicMove): ExpressionRegister[] {
  return MOVE_EXPRESSION[move].affords
}

/** Whether a move can raise awareness in the given register. */
export function moveAffordsRegister(move: BasicMove, register: ExpressionRegister): boolean {
  return MOVE_EXPRESSION[move].affords.includes(register)
}

/** The register a card should default to when drafting its awareness application. */
export function primaryRegisterForCard(card: Pick<MoveCard, 'move'>): ExpressionRegister {
  return primaryRegisterForMove(card.move)
}

/** Every register a card can be expressed in. */
export function registersForCard(card: Pick<MoveCard, 'move'>): ExpressionRegister[] {
  return registersForMove(card.move)
}
