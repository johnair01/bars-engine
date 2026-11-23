/**
 * Canonical Kernel for Random Unpacking
 *
 * Satisfaction/dissatisfaction derived from emotional alchemy moves.
 * Element → channel states per .agent/context/emotional-alchemy-interfaces.md §5.
 *
 * See: .specify/specs/random-unpacking-canonical-kernel/spec.md
 */

import type { ElementKey } from './elements'
import type { PersonalMoveType, MoveCellAffinity, EnactedMove } from './types'
import type { CanonicalMove } from './move-engine'
import { EXPERIENCE_OPTIONS } from './unpacking-constants'

/** Element → dissatisfied/satisfied labels. Derived from emotional-alchemy-interfaces.md §5. */
export const ELEMENT_CHANNEL_STATES: Record<
  ElementKey,
  { dissatisfiedLabels: string[]; satisfiedLabels: string[] }
> = {
  metal: {
    dissatisfiedLabels: ['anxious', 'scared', 'worried'],
    satisfiedLabels: ['excited', 'relieved'],
  },
  water: {
    dissatisfiedLabels: ['sad', 'disappointed', 'isolated'],
    satisfiedLabels: ['poignant', 'fulfilled'],
  },
  wood: {
    dissatisfiedLabels: ['numb', 'overwhelmed'],
    satisfiedLabels: ['energized', 'triumphant', 'blissful'],
  },
  fire: {
    dissatisfiedLabels: ['frustrated'],
    satisfiedLabels: ['triumphant'],
  },
  earth: {
    dissatisfiedLabels: ['boredom', 'apathy'],
    satisfiedLabels: ['peaceful'],
  },
}

/**
 * Element → allyship domains (WHERE).
 *
 * Wendell, 2026-11-20: "the domains shouldn't be mapped to an element. All 5 elements can
 * apply to each of the 4 domains." There is therefore no element→domain table: every element
 * carries every domain, so an element alone cannot pick one. `pickExperienceForPlayer` reads
 * the archetype's move affinity (which is a claim about the player, not about an element) and
 * otherwise asks, rather than guessing.
 */

/**
 * WAVE move → its cell of the board, as "this move, carried in this domain, on this aspect".
 *
 * Wendell, 2026-11-20: "One should be able to do all 5 basic moves at whatever element is
 * alive in whatever domain makes sense." There is therefore no move→domain table any more:
 * each of the five moves can be carried in any of the four domains, in any of the five
 * elements. The domain is something the caller knows — the player chose it, the campaign set
 * it, the quest is about it — and a move on its own cannot tell you which one it was.
 *
 * `aspect` alone is still a property of the move: the five WAVE moves are the INNER column
 * (self-development), and an outer enactment is the same move turned toward others.
 */

/**
 * FR6 — resolve an enacted move to its cell of the board (domain × aspect).
 *
 * The bridge between the IOA grammar ({@link EnactedMove}) and the integral board: the
 * **aspect follows the enactment** — `inner` → self-development, `outer` → allyship in
 * others' right-hand. The **domain is asked for, not derived**: no move owns one (2026-11-20).
 * Deterministic, no AI. Style (which *face* enacts the outer move) is a separate concern —
 * see `describeMove` (FR7); the with/for shadow reading of the outer cell is a documented
 * seam, not enacted here (spec Design Decisions).
 */
export function resolveMoveCell(m: EnactedMove, domain: string): MoveCellAffinity {
  return { domain, aspect: m.aspect }
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/**
 * Get dissatisfied and satisfied labels for a canonical move.
 * Transcend: use element for both from and to.
 * Translate: use fromElement → dissatisfied, toElement → satisfied.
 * Returns 2 labels from each array (pickN-style).
 */
export function getLabelsForMove(move: CanonicalMove): {
  dissatisfiedLabels: string[]
  satisfiedLabels: string[]
} {
  let fromElement: ElementKey
  let toElement: ElementKey

  if (move.category === 'Transcend' && move.element) {
    fromElement = move.element
    toElement = move.element
  } else if (move.fromElement && move.toElement) {
    fromElement = move.fromElement
    toElement = move.toElement
  } else {
    fromElement = 'earth'
    toElement = 'earth'
  }

  const fromStates = ELEMENT_CHANNEL_STATES[fromElement]
  const toStates = ELEMENT_CHANNEL_STATES[toElement]

  return {
    dissatisfiedLabels: pickN(fromStates.dissatisfiedLabels, 2),
    satisfiedLabels: pickN(toStates.satisfiedLabels, 2),
  }
}

/**
 * Pick experience (Q1) for a player. Q1 is the domain — which of the four kinds of work the
 * quest sends them to do.
 *
 * Neither an element NOR a move picks the domain. Wendell, 2026-11-20: all five elements can
 * carry all four domains, and "one should be able to do all 5 basic moves at whatever element
 * is alive in whatever domain makes sense." So nothing here can infer a domain; a caller that
 * knows it (the player chose it, the campaign set it, the quest is about it) passes it.
 *
 * When the domain is genuinely unknown this returns the first option, which is a placeholder
 * and not a recommendation — callers should prefer to ask than to ship a guessed domain.
 */
export function pickExperienceForPlayer(
  _nationElement?: ElementKey,
  _archetypeWave?: PersonalMoveType,
  chosenDomain?: string
): string {
  if (chosenDomain && (EXPERIENCE_OPTIONS as readonly string[]).includes(chosenDomain)) {
    return chosenDomain
  }
  return EXPERIENCE_OPTIONS[0]!
}
