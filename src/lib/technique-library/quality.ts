/**
 * Move Quality Rubric + deterministic assessment.
 * Spec: .specify/specs/superpower-deck-quality/spec.md
 *
 * 12 criteria, each traceable to the MTGOA book or the base Allyship Deck's
 * authored anatomy. `assessQuality` grades a Technique criterion-by-criterion
 * and maps the met set to a level L0–L4 ("usable" = L3). Pure / deterministic.
 *
 * Heuristic criteria (#1, #2, #10, #11, #12) approximate from text/fields — they
 * flag, humans confirm for L4. They are marked `heuristic: true` in RUBRIC.
 */

import type { Technique } from './types'

export interface RubricCriterion {
  id: number
  name: string
  group: 'form' | 'anatomy' | 'trust' | 'voice'
  source: string
  heuristic?: boolean
}

export const RUBRIC: RubricCriterion[] = [
  { id: 1, name: 'Enactable now', group: 'form', source: 'base deck remediation', heuristic: true },
  { id: 2, name: 'One clear practice', group: 'form', source: 'book "Game" moves', heuristic: true },
  { id: 3, name: 'Dual reading (inner/outer)', group: 'form', source: 'base deck primary/campaign question' },
  { id: 4, name: 'Optimizes for', group: 'anatomy', source: 'base deck optimizesFor' },
  { id: 5, name: 'Forbidden moves', group: 'anatomy', source: 'base deck forbiddenMoves' },
  { id: 6, name: 'Failure modes', group: 'anatomy', source: 'base deck failureModes' },
  { id: 7, name: 'Remediation', group: 'anatomy', source: 'base deck remediation' },
  { id: 8, name: 'Working-vs-performed tell', group: 'trust', source: "Diplomat's Game tells" },
  { id: 9, name: 'Shadow check', group: 'trust', source: 'book superpower shadows' },
  { id: 10, name: 'Body test (Shaman’s Rule)', group: 'trust', source: 'book', heuristic: true },
  { id: 11, name: 'Token/ticket + consent/placement', group: 'trust', source: 'book', heuristic: true },
  { id: 12, name: 'In-voice & cell-specific', group: 'voice', source: 'base deck flavor / MTGOA tone', heuristic: true },
]

export interface QualityAssessment {
  level: 0 | 1 | 2 | 3 | 4
  met: number[]
  unmet: number[]
}

// ── templated-content detection (the generated L0/L1 floor) ──
const TEMPLATED_ESSENCE = /^(In yourself|For others):/
const TEMPLATED_STEP = /^(Practice it within:|Offer it to others:)/
const TEMPLATED_NAME_SUFFIX = /\s—\s(Sense|Edge|Steward|Structure|Bridge|Whole)$/
const BODY_WORDS = /\b(body|bodies|felt|feel|feeling|sensation|breath|flinch|gut)\b/i
const CONSENT_WORDS =
  /\b(consent|no[-\s]?strings|wanted|invite|invitation|is this my room|increase life|without pressure|obligation|ledger)\b/i

function isTemplated(t: Technique): boolean {
  return (
    TEMPLATED_ESSENCE.test(t.essence) ||
    t.steps.some((s) => TEMPLATED_STEP.test(s)) ||
    TEMPLATED_NAME_SUFFIX.test(t.name)
  )
}

function corpus(t: Technique): string {
  return [t.essence, t.primaryQuestion, t.campaignQuestion, t.optimizesFor, t.example, ...t.steps]
    .filter(Boolean)
    .join(' ')
}

/** Per-criterion predicates. */
function evaluate(t: Technique): Record<number, boolean> {
  const templated = isTemplated(t)
  const realSteps = t.steps.filter((s) => !TEMPLATED_STEP.test(s) && !/^Shadow check:/.test(s))
  const text = corpus(t)

  return {
    1: !templated && realSteps.length >= 2,
    2: !templated && realSteps.length >= 2 && realSteps.length <= 5,
    3:
      t.aspect === 'inner'
        ? !!t.primaryQuestion
        : t.aspect === 'outer'
          ? !!t.campaignQuestion
          : !!(t.primaryQuestion && t.campaignQuestion),
    4: !!t.optimizesFor,
    5: !!t.forbiddenMoves?.length,
    6: !!t.failureModes?.length,
    7: !!t.remediation,
    8: !!(t.tell?.working && t.tell?.performed),
    9: t.steps.some((s) => /shadow/i.test(s)) || !!t.contraindications?.length,
    10: BODY_WORDS.test(text),
    11: CONSENT_WORDS.test(text) || !!t.forbiddenMoves?.some((f) => /pressur|obligation|guilt|strings/i.test(f)),
    12: !templated,
  }
}

const TIER: Record<number, number[]> = {
  1: [1, 2],
  2: [1, 2, 3, 4, 5, 6, 7],
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}

export function assessQuality(t: Technique): QualityAssessment {
  const results = evaluate(t)
  const met = RUBRIC.map((c) => c.id).filter((id) => results[id])
  const unmet = RUBRIC.map((c) => c.id).filter((id) => !results[id])

  let level: 0 | 1 | 2 | 3 | 4 = 0
  for (const lvl of [4, 3, 2, 1] as const) {
    if (TIER[lvl]!.every((id) => results[id])) {
      level = lvl
      break
    }
  }
  return { level, met, unmet }
}
