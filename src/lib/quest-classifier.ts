/**
 * Heuristic domain classification for book analysis.
 * Suggests allyship domain from keyword scoring when confidence is high.
 * Used as a hint to AI (not a replacement) to improve consistency and reduce ambiguity.
 *
 * Spec: .specify/specs/ai-deftness-token-strategy/spec.md Phase 4
 */

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  SKILLFUL_ORGANIZING: [
    'delegate', 'delegating', 'organize', 'organizing', 'coordinate', 'coordinating',
    'structure', 'structures', 'process', 'processes', 'routine', 'routines',
    'system', 'systems', 'workflow', 'interface', 'habits', 'distribute',
  ],
  RAISE_AWARENESS: [
    'visibility', 'visible', 'discover', 'discovery', 'share', 'sharing',
    'let others know', 'helping others see', 'spread the word', 'communicate',
    'awareness', 'inform', 'inform others', 'make known',
  ],
  DIRECT_ACTION: [
    'obstacle', 'obstacles', 'blocking', 'blocked', 'remove', 'removing',
    'step', 'steps', 'action', 'take action', 'concrete', 'do the work',
    'first step', 'unblock', 'break through', 'overcome',
  ],
  GATHERING_RESOURCES: [
    'resource', 'resources', 'capacity', 'energy', 'accumulate', 'accumulating',
    'collect', 'collecting', 'build up', 'building up', 'support', 'funding',
    'manpower', 'expertise', 'materials', 'reserves', 'emotional energy',
  ],
}

const CONFIDENCE_THRESHOLD = 0.8

export type SuggestDomainResult = {
  domain: string | null
  confidence: number
}

/**
 * Suggest allyship domain from text using keyword scoring.
 * Returns domain and confidence when score is high enough.
 * Use as hint to AI when confidence > threshold; do not skip AI.
 */
export function suggestDomain(text: string): SuggestDomainResult {
  const lower = text.toLowerCase()
  const scores: Record<string, number> = {
    GATHERING_RESOURCES: 0,
    DIRECT_ACTION: 0,
    RAISE_AWARENESS: 0,
    SKILLFUL_ORGANIZING: 0,
  }

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[domain] = (scores[domain] ?? 0) + 1
      }
    }
  }

  const entries = Object.entries(scores).filter(([, v]) => v > 0)
  if (entries.length === 0) return { domain: null, confidence: 0 }

  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  const [topDomain, topScore] = entries.reduce((best, curr) =>
    curr[1] > best[1] ? curr : best
  )

  // Confidence: top score dominance + total matches
  const dominance = total > 0 ? topScore / total : 0
  const matchStrength = Math.min(1, topScore / 5) // cap at 5 matches
  const confidence = dominance * 0.7 + matchStrength * 0.3

  if (confidence >= CONFIDENCE_THRESHOLD) {
    return { domain: topDomain, confidence }
  }
  return { domain: null, confidence }
}

export { CONFIDENCE_THRESHOLD }
