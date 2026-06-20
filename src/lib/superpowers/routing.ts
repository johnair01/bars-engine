/**
 * Quiz result → superpower routing (campaign Phase 2, FR5; quiz-design Phase 3, FR7).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 *
 * Pure bridge from the quiz scorer's `QuizResult` to the campaign-facing
 * `SuperpowerRoutingResult` + composed reveal copy. Deterministic, no I/O — the
 * server action and reveal UI consume this. (The quiz is a standalone instrument;
 * if it is ever embedded in the ECI template flow, this result can be merged with
 * `IntakeRoutingResult`.)
 */
import type { Superpower, SuperpowerOrientation } from './types'
import { scoreQuiz } from './quiz/score'
import { composeResultCopy, type ResultCopy } from './quiz/descriptions'
import type { QuizAnswer, QuizResult, RankedSuperpower } from './quiz/types'

export interface SuperpowerRoutingResult {
  /** Primary superpower (top of the ranking). */
  superpower: Superpower
  /** Runner-up — surfaced as a "wing", never co-equal. */
  secondary: Superpower
  /** Internal/external; null when the orientation item was not answered. */
  orientation: SuperpowerOrientation | null
  /** primary.pct − secondary.pct, in [0,1]. */
  margin: number
  /** Whether the margin clears the confidence threshold. */
  confident: boolean
  /** Full ranking (for the reveal's spectrum view). */
  ranked: RankedSuperpower[]
}

/** Map a scored `QuizResult` into the campaign routing shape. Pure. */
export function quizResultToRouting(result: QuizResult): SuperpowerRoutingResult {
  return {
    superpower: result.primary,
    secondary: result.secondary,
    orientation: result.orientation,
    margin: result.margin,
    confident: result.confident,
    ranked: result.ranked,
  }
}

export interface SuperpowerIntakeOutcome {
  routing: SuperpowerRoutingResult
  copy: ResultCopy
}

/**
 * Score answers and produce both the routing result and the reveal copy.
 * Deterministic — this is what `submitSuperpowerIntake` returns.
 */
export function resolveSuperpowerIntake(
  answers: QuizAnswer[],
  orientation: SuperpowerOrientation | null = null,
): SuperpowerIntakeOutcome {
  const result = scoreQuiz(answers, orientation)
  return { routing: quizResultToRouting(result), copy: composeResultCopy(result) }
}
