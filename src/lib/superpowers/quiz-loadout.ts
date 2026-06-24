/**
 * Quiz result → two-slot Loadout (cross-branch reconciliation, mapping M1).
 * Spec: .specify/specs/superpower-system-reconciliation/reconciliation.md
 *
 * The quiz (Branch B) yields a ranked `{ primary, secondary, orientation }`.
 * The Go Deeper funnel (Branch A) needs a `{ inner, outer }` Loadout on Player.
 * This pure bridge is the single, authoritative crossover point.
 *
 * Mapping M1 (chosen in the reconciliation doc):
 *   - orientation 'internal' → the player leads with self-defense:
 *       inner = primary (their strongest method, turned inward)
 *       outer = secondary (the wing, turned toward others)
 *   - orientation 'external' → the player leads with helping others:
 *       inner = secondary, outer = primary
 *   - orientation null (item unanswered) → default to the internal reading,
 *       which keeps the player's strongest superpower in their inner slot.
 *
 * Deterministic, no I/O. The server action consumes this then persists via
 * `saveSuperpowerLoadout`.
 */
import type { Loadout } from '@/lib/technique-library'
import type { SuperpowerRoutingResult } from './routing'
import type { QuizResult } from './quiz/types'
import type { Superpower, SuperpowerOrientation } from './types'

/** Minimal shape both `QuizResult` and `SuperpowerRoutingResult` satisfy. */
interface RankedPair {
  primary?: Superpower
  secondary?: Superpower
  superpower?: Superpower
  orientation: SuperpowerOrientation | null
}

/**
 * Map a scored quiz outcome to a two-slot Loadout (M1). Accepts either the
 * raw `QuizResult` (primary/secondary) or the `SuperpowerRoutingResult`
 * (superpower/secondary) — both carry the same ranking + orientation.
 */
export function quizResultToLoadout(result: QuizResult | SuperpowerRoutingResult): Loadout {
  const r = result as RankedPair
  const primary = r.primary ?? r.superpower
  const secondary = r.secondary
  if (!primary || !secondary) {
    throw new Error('quizResultToLoadout: result is missing primary/secondary superpower')
  }

  // null orientation defaults to 'internal' (strongest superpower stays inner).
  const leadsExternal = r.orientation === 'external'
  return leadsExternal
    ? { inner: secondary, outer: primary }
    : { inner: primary, outer: secondary }
}
