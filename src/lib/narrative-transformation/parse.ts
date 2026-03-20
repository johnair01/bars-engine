/**
 * Heuristic narrative parser (v0)
 * Spec: .specify/specs/narrative-transformation-engine/spec.md — FR1–FR3
 */

import type { NarrativeParseResult } from './types'
import { detectLockType } from './lockDetection'

const NEGATION_RE = /\b(can't|cannot|ca\s*n't|never|not\b|no\s+one|nobody|nothing)\b/gi

function collectNegations(text: string): string[] {
  const out: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(NEGATION_RE.source, NEGATION_RE.flags)
  while ((m = re.exec(text)) !== null) {
    const g = m[1]?.toLowerCase().replace(/\s+/g, '') ?? ''
    if (g && !out.includes(g)) out.push(g)
  }
  return out
}

/**
 * Extract actor, state, object from short stuck narratives (English heuristic).
 */
export function parseNarrative(rawText: string): NarrativeParseResult {
  const trimmed = rawText.trim()
  const negations = collectNegations(trimmed)

  let actor = 'I'
  let state = ''
  let object = ''
  let confidence = 0.35

  // "X makes me Y"
  let m = trimmed.match(/^(.+?)\s+makes?\s+me\s+(.+?)\s*\.?\s*$/i)
  if (m) {
    actor = 'I'
    object = m[1].trim()
    state = m[2].trim()
    confidence = 0.8
  }

  // "I'm afraid of failing"
  if (!state) {
    m = trimmed.match(/^(?:I|i)(?:'m|\s+am)\s+afraid\s+of\s+(.+?)\s*\.?\s*$/i)
    if (m) {
      object = m[1].trim()
      state = 'afraid'
      confidence = 0.88
    }
  }

  // "I feel overwhelmed"
  if (!state) {
    m = trimmed.match(/^(?:I|i)\s+feel\s+(.+?)\s*\.?\s*$/i)
    if (m) {
      state = m[1].trim()
      confidence = 0.82
    }
  }

  // "I am a fraud" / "I'm an impostor"
  if (!state) {
    m = trimmed.match(/^(?:I|i)(?:'m|\s+am(?:\s+not)?)\s+(?:a|an)\s+(.+?)\s*\.?\s*$/i)
    if (m) {
      state = m[1].trim()
      confidence = 0.78
    }
  }

  // "I am tired" (non a/an)
  if (!state) {
    m = trimmed.match(/^(?:I|i)(?:'m|\s+am)\s+(.+?)\s*\.?\s*$/i)
    if (m) {
      state = m[1].trim()
      confidence = 0.72
    }
  }

  // Fallback: first sentence fragment as state
  if (!state && trimmed.length > 0) {
    const first = trimmed.split(/[.!?]/)[0]?.trim() ?? trimmed
    state = first.slice(0, 200)
    confidence = Math.min(confidence, 0.4)
  }

  const lock_type = detectLockType(trimmed)

  return {
    raw_text: trimmed,
    actor,
    state,
    object,
    negations: negations.length ? negations : undefined,
    confidence,
    lock_type,
    parse_confidence: confidence,
  }
}
