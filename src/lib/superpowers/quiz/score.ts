/**
 * Superpower Quiz — deterministic scorer (superpower-quiz-design, Phase 1).
 * Spec: .specify/specs/superpower-quiz-design/spec.md  (§ Scoring)
 *
 * Algorithm (deterministic, offline, no AI):
 *   1. raw[t]  = Σ chosen option weights for t           (one answer per item)
 *   2. max[t]  = Σ over items of the best weight any one option gives t
 *   3. pct[t]  = max>0 ? raw/max : 0                      (percent-of-max)
 *   4. rank all 7 by pct desc, ties broken by fixed TIE_ORDER (never random)
 *   5. primary/secondary = ranked[0]/[1]; margin = Δpct; confident = margin ≥ θ
 */
import { SUPERPOWERS, type Superpower, type SuperpowerOrientation } from '../types'
import { QUIZ_ITEMS } from './items'
import type { QuizAnswer, QuizItem, QuizResult, RankedSuperpower } from './types'

/** Margin (in percent-of-max) required to call a primary "confident". Open Q #1. */
export const CONFIDENCE_THRESHOLD = 0.1

/**
 * Fixed tie-break chain — applied when two superpowers have equal pct. Never
 * random; lower index wins. Documented arbitrary-but-stable (canonical order).
 */
export const TIE_ORDER: readonly Superpower[] = [
  'connector',
  'storyteller',
  'strategist',
  'disruptor',
  'alchemist',
  'escape_artist',
  'coach',
] as const

function emptyScores(): Record<Superpower, number> {
  return Object.fromEntries(SUPERPOWERS.map((s) => [s, 0])) as Record<Superpower, number>
}

function maxByType(items: QuizItem[]): Record<Superpower, number> {
  const max = emptyScores()
  for (const item of items) {
    for (const sp of SUPERPOWERS) {
      let best = 0
      for (const opt of item.options) best = Math.max(best, opt.weights[sp] ?? 0)
      max[sp] += best
    }
  }
  return max
}

function tieIndex(sp: Superpower): number {
  const i = TIE_ORDER.indexOf(sp)
  return i === -1 ? Number.MAX_SAFE_INTEGER : i
}

/**
 * Score a set of answers into a ranked result. `answers` are deduped by item
 * (last answer wins) so a type's pct can never exceed 1.0. `items` is injectable
 * for testing; defaults to the published bank.
 */
export function scoreQuiz(
  answers: QuizAnswer[],
  orientation: SuperpowerOrientation | null = null,
  items: QuizItem[] = QUIZ_ITEMS,
): QuizResult {
  const itemsById = new Map(items.map((i) => [i.id, i]))

  // one answer per item (last wins) — protects percent-of-max
  const chosen = new Map<string, string>()
  for (const a of answers) chosen.set(a.itemId, a.optionId)

  const raw = emptyScores()
  for (const [itemId, optionId] of chosen) {
    const item = itemsById.get(itemId)
    const opt = item?.options.find((o) => o.id === optionId)
    if (!opt) continue
    for (const sp of SUPERPOWERS) raw[sp] += opt.weights[sp] ?? 0
  }

  const max = maxByType(items)
  const ranked: RankedSuperpower[] = SUPERPOWERS.map((sp) => ({
    superpower: sp,
    raw: raw[sp],
    max: max[sp],
    pct: max[sp] > 0 ? raw[sp] / max[sp] : 0,
  })).sort((a, b) => b.pct - a.pct || tieIndex(a.superpower) - tieIndex(b.superpower))

  const margin = ranked[0].pct - ranked[1].pct
  return {
    ranked,
    primary: ranked[0].superpower,
    secondary: ranked[1].superpower,
    margin,
    confident: margin >= CONFIDENCE_THRESHOLD,
    orientation,
  }
}
