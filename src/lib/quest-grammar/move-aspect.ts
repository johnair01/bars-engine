/**
 * Move × Aspect grammar — the inner/outer expression of each WAVE move.
 *
 * Inner = self-development (left-hand, the existing default). Outer = allyship
 * enacted in others'/collective right-hand quadrants. Same five moves, two
 * directions of enactment. The grammar is **authored data**, not AI-generated —
 * deterministic and offline-capable (Portland AI-allergy: non-AI path is first-class).
 *
 * Influence: "Mastering the Game of Allyship" (Wendell Britt).
 * See: .specify/specs/inner-outer-allyship-moves/spec.md
 */

import type { PersonalMoveType } from './types'
import type { AllyshipTarget, EnactedMove } from './types'

/** The two directional expressions of a move, plus its canonical (hint-only) target. */
interface MoveAspectExpression {
  /** Self-directed phrasing (left-hand). */
  inner: string
  /** Target-agnostic verb phrase for the allyship expression (right-hand). */
  outer: string
  /**
   * Canonical target — a narrative hint used when none is supplied. NOT a
   * constraint: all move × target combos are valid (spec OQ1, "allow all").
   */
  defaultTarget: AllyshipTarget
}

/**
 * The heart of IOA. Exhaustive over PersonalMoveType.
 *
 * Open Up (outer) is **receptive** — make room, hold the container, draw out what
 * is already there. Grow Up (outer) is **generative** — actively build/transfer
 * capacity. Both live in Gather Resource but stay distinct, mirroring their inner
 * meanings (receive vs. build). Wake Up (outer) is "witness & amplify", not
 * "market" — same move, no commercial register (community-sensitivity decision).
 */
const MOVE_ASPECT_MATRIX: Record<PersonalMoveType, MoveAspectExpression> = {
  wakeUp: {
    inner: 'see for yourself — notice your own charge, privilege, what is true',
    outer: 'help others see — witness & amplify',
    defaultTarget: 'collective',
  },
  openUp: {
    inner: 'open to receive emotional energy, possibility, and emergence within',
    outer: 'hold space — make room for resource to arrive',
    defaultTarget: 'individual',
  },
  cleanUp: {
    inner: 'parts work, shadow, self-governance',
    outer: 'repair the systems — clear structural distortion',
    defaultTarget: 'system',
  },
  growUp: {
    inner: 'build your own capacity and developmental lines',
    outer: 'mentor and resource — build capacity',
    defaultTarget: 'individual',
  },
  showUp: {
    inner: 'aligned doing — embody your insight and take your own action',
    outer: 'take direct action on the ground',
    defaultTarget: 'collective',
  },
}

/** How each target reads in the trailing allyship clause. */
const TARGET_LABEL: Record<AllyshipTarget, string> = {
  individual: 'another person',
  collective: 'the collective',
  system: 'the system',
}

/**
 * Deterministic description of an enacted move. No AI.
 * Inner returns the self-directed phrasing. Outer returns the verb phrase woven
 * with a "with {target}" clause (with/for axis deferred → always "with" for now).
 */
export function describeMove(m: EnactedMove): string {
  const expr = MOVE_ASPECT_MATRIX[m.move]
  if (m.aspect === 'inner') return expr.inner
  const target = m.target ?? expr.defaultTarget
  return `${expr.outer} — with ${TARGET_LABEL[target]}`
}

/**
 * Type guard for an enacted move's shape:
 * - outer ⇒ must carry a target (the structural difference of allyship)
 * - inner ⇒ self-directed, must NOT carry a target
 * Move × target pairings are otherwise unconstrained ("allow all", spec OQ1).
 */
export function isValidEnactedMove(m: EnactedMove): boolean {
  if (!(m.move in MOVE_ASPECT_MATRIX)) return false
  return m.aspect === 'outer' ? m.target !== undefined : m.target === undefined
}

export { MOVE_ASPECT_MATRIX }
export type { MoveAspectExpression }
