/**
 * Build registry QuestSeed from narrative text or parse result.
 * Spec: .specify/specs/narrative-transformation-engine/plan.md
 */

import { assembleQuestSeed } from '@/lib/transformation-move-registry/services'
import type { LockType, ParsedNarrative, QuestSeed } from '@/lib/transformation-move-registry/types'
import { buildTransformationHints } from './alchemyHints'
import type { DefaultMoveIdBundle } from './moves/selectMoves'
import { selectDefaultMoveIds } from './moves/selectMoves'
import { parseNarrative } from './parse'
import type { NarrativeParseResult } from './types'

const DEFAULT_LOCK: LockType = 'emotional_lock'

/** Options for `buildQuestSeedFromParsed` / `buildQuestSeedFromText`. */
export type BuildQuestSeedOptions = {
  /** Nation id (e.g. `argyra`) — biases move selection via nation profiles */
  nationId?: string | null
  archetypeKey?: string | null
  moveOverrides?: Partial<DefaultMoveIdBundle>
  useAlchemyChannelInSeed?: boolean
  nationName?: string | null
  archetypeName?: string | null
}

function toRegistryParsedNarrative(parsed: NarrativeParseResult): ParsedNarrative {
  return {
    raw_text: parsed.raw_text,
    actor: parsed.actor,
    state: parsed.state,
    object: parsed.object,
    negations: parsed.negations,
    confidence: parsed.confidence,
  }
}

export function buildQuestSeedFromParsed(
  parsed: NarrativeParseResult,
  opts?: BuildQuestSeedOptions
): QuestSeed {
  const lock = parsed.lock_type ?? DEFAULT_LOCK
  const narrative = toRegistryParsedNarrative(parsed)
  const moveIds = selectDefaultMoveIds(parsed, {
    overrides: opts?.moveOverrides,
    nationId: opts?.nationId ?? null,
    archetypeKey: opts?.archetypeKey ?? null,
  })
  const useChannel = opts?.useAlchemyChannelInSeed !== false
  const hints = useChannel ? buildTransformationHints(narrative) : null
  return assembleQuestSeed(narrative, lock, moveIds, {
    archetypeKey: opts?.archetypeKey ?? undefined,
    renderContext:
      hints || opts?.nationName || opts?.archetypeName
        ? {
            emotion_channel: hints?.emotion_channel,
            nation_name: opts?.nationName ?? undefined,
            archetype_name: opts?.archetypeName ?? undefined,
          }
        : undefined,
  })
}

export function buildQuestSeedFromText(rawText: string, opts?: BuildQuestSeedOptions): QuestSeed {
  return buildQuestSeedFromParsed(parseNarrative(rawText), opts)
}
