/**
 * Emotional Alchemy Ontology
 *
 * Maps unpacking data (satisfaction, dissatisfaction, self-sabotage) to narrative
 * movement (translate vs transcend). The system understands the narrative before
 * players encounter it.
 *
 * See: .agent/context/emotional-alchemy-ontology.md
 */

import type { MovementType } from './types'

/** Normalize string or string[] to string[] for derivation */
function toLabels(value: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((s) => s.trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
}

/** Shadow voice patterns — match self-sabotage labels */
const SHADOW_PATTERNS = [
  /not\s+ready/i,
  /not\s+worthy/i,
  /not\s+good\s+enough/i,
  /not\s+capable/i,
  /insignificant/i,
  /don'?t\s+belong/i,
]

function countShadowVoices(labels: string[]): number {
  const combined = labels.join(' ').toLowerCase()
  return SHADOW_PATTERNS.filter((p) => p.test(combined)).length
}

/**
 * Derive movementPerNode from unpacking data.
 *
 * Rules (from ontology):
 * - Shadow score + dissatisfaction score > satisfaction score → transcend-dominant
 * - Default arc: translate for beats 0–3, transcend for 4–5 (Epiphany Bridge)
 * - Transcend-dominant: more nodes shift to transcend earlier
 */
export function deriveMovementPerNode(
  satisfiedLabels: string | string[],
  dissatisfiedLabels: string | string[],
  shadowVoices: string | string[],
  nodeCount: number = 6
): MovementType[] {
  const satisfied = toLabels(satisfiedLabels)
  const dissatisfied = toLabels(dissatisfiedLabels)
  const shadows = toLabels(shadowVoices)

  const satisfactionScore = satisfied.length
  const dissatisfactionScore = dissatisfied.length
  const shadowScore = shadows.length > 0 ? shadows.length : countShadowVoices(dissatisfied)

  const transcendDominant = shadowScore + dissatisfactionScore > satisfactionScore

  const result: MovementType[] = []

  for (let i = 0; i < nodeCount; i++) {
    if (i >= nodeCount - 2) {
      result.push('transcend')
    } else if (transcendDominant && i >= nodeCount - 4) {
      result.push('transcend')
    } else {
      result.push('translate')
    }
  }

  return result
}

/** Default movement arc for Epiphany Bridge (6 beats) */
export const DEFAULT_MOVEMENT_PER_NODE: MovementType[] = [
  'translate',
  'translate',
  'translate',
  'translate',
  'transcend',
  'transcend',
]
