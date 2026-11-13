/**
 * Jev pre-translation quality gate — SPEC-jev-quality-gate-001, Phase 1.
 *
 * One score-type gate in front of dispatchAI: scores the authored blessed-object
 * description for translation readiness before the expensive Sonnet call runs.
 * Jev picks/scores/checks and never writes text (jev-select-only); the state is
 * authored prose, never player text (jev-no-player-text).
 *
 * Modes (env JEV_QUALITY_GATE_MODE, default off):
 *   off     — no Jev call at all, gate returns ok immediately
 *   shadow  — one Jev call, score logged, never blocks
 *   enforce — score below JEV_QUALITY_THRESHOLD → ok: false → QualityGateError
 *             (Phase 3 wires the route mapping; the function supports it now)
 *
 * jev-fallback: any Jev failure (no auth, outage, timeout, malformed answer)
 * resolves ok: true with a bypassed reason — the gate degrades to absent,
 * never to rejecting. Calibration (Phase 2) picks the threshold; nothing
 * auto-rejects on an unconfigured or uncalibrated cutoff.
 */

import { decide, JEV_MAX_STATE_CHARS } from '@/lib/jev/client'
import type { AuthoredContent } from './translator'

export type QualityGateMode = 'off' | 'shadow' | 'enforce'

export interface QualityGateResult {
  ok: boolean
  score: number | null
  threshold: number | null
  mode: QualityGateMode
  bypassed?: string
}

export class QualityGateError extends Error {
  readonly score: number
  readonly threshold: number

  constructor(score: number, threshold: number) {
    super(`Quality gate rejected content: score ${score} below threshold ${threshold}`)
    this.name = 'QualityGateError'
    this.score = score
    this.threshold = threshold
  }
}

/**
 * Criteria grounded in the blessed-object NL contract (prompts/blessed-object.ts):
 * the description must support an evocative name, a two-line atmosphere,
 * history-bearing props, and an inferable mood from the tag set.
 */
export const QUALITY_CRITERIA = [
  'specificity: the description supports an evocative, specific name rather than a generic one like Room 1',
  'atmosphere: enough sensory material for a two-line atmospheric description',
  "props-history: the description implies the object's history and purpose, which props can reflect",
  'mood-resonance: a coherent mood is inferable from the set dark, mysterious, sacred, haunted, ancient, eerie, somber, grand, forgotten',
]

export const QUALITY_QUESTION = 'translation-readiness'

function resolveMode(): QualityGateMode {
  const raw = process.env.JEV_QUALITY_GATE_MODE
  return raw === 'shadow' || raw === 'enforce' ? raw : 'off'
}

function resolveThreshold(): number | null {
  const raw = process.env.JEV_QUALITY_GATE_THRESHOLD
  if (!raw) return null
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : null
}

function buildState(seed: AuthoredContent): string {
  const state = `Title: ${seed.title}\n\nDescription: ${seed.description}`
  return state.length > JEV_MAX_STATE_CHARS ? state.slice(0, JEV_MAX_STATE_CHARS) : state
}

export async function runQualityGate(
  seed: AuthoredContent,
  opts: { fetchImpl?: typeof fetch; oidcToken?: string | null } = {},
): Promise<QualityGateResult> {
  const mode = resolveMode()
  if (mode === 'off') return { ok: true, score: null, threshold: null, mode }

  const result = await decide(
    buildState(seed),
    {
      [QUALITY_QUESTION]: {
        type: 'score',
        instructions: 'Score this blessed object description for translation readiness.',
        criteria: QUALITY_CRITERIA,
      },
    },
    opts,
  )

  if (!result.ok) {
    return { ok: true, score: null, threshold: null, mode, bypassed: result.error }
  }

  const score = result.answers[QUALITY_QUESTION]?.score ?? null

  if (mode === 'shadow') {
    console.log('[jev-quality-gate]', JSON.stringify({ id: seed.id, mode, score }))
    return { ok: true, score, threshold: null, mode }
  }

  const threshold = resolveThreshold()
  if (threshold === null) {
    return { ok: true, score, threshold: null, mode, bypassed: 'no threshold configured' }
  }
  if (score === null) {
    return { ok: true, score: null, threshold, mode, bypassed: 'score missing from Jev answer' }
  }
  if (score < threshold) throw new QualityGateError(score, threshold)
  return { ok: true, score, threshold, mode }
}
