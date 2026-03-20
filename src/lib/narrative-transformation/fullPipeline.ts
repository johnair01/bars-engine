/**
 * Full narrative transformation: parse + hints + quest seed (for API / admin tooling).
 */

import type { QuestSeed } from '@/lib/transformation-move-registry/types'
import { buildTransformationHints, type NarrativeTransformationHints } from './alchemyHints'
import { buildQuestSeedFromParsed, type BuildQuestSeedOptions } from './seedFromNarrative'
import { parseNarrative } from './parse'
import type { NarrativeParseResult } from './types'

export type NarrativeTransformationFullResult = {
  parse: NarrativeParseResult
  hints: NarrativeTransformationHints
  questSeed: QuestSeed
}

/**
 * Parse raw text, emit alchemy/321 hints, and assemble registry quest seed in one call.
 */
export function runNarrativeTransformationFull(
  rawText: string,
  opts?: BuildQuestSeedOptions
): NarrativeTransformationFullResult {
  const parsed = parseNarrative(rawText)
  const narrative = {
    raw_text: parsed.raw_text,
    actor: parsed.actor,
    state: parsed.state,
    object: parsed.object,
    negations: parsed.negations,
    confidence: parsed.confidence,
  }
  const hints = buildTransformationHints(narrative)
  const questSeed = buildQuestSeedFromParsed(parsed, opts)
  return { parse: parsed, hints, questSeed }
}
