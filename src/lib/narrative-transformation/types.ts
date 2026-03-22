/**
 * Narrative Transformation Engine v0 — types
 * Spec: .specify/specs/narrative-transformation-engine/spec.md
 *
 * Base narrative shape aligns with transformation-move-registry for later move / quest-seed assembly.
 */

import type { EmotionChannel, LockType, ParsedNarrative } from '@/lib/transformation-move-registry/types'

export type { EmotionChannel, LockType, ParsedNarrative }

/** Heuristic parse output: registry narrative + optional lock + parser confidence */
export type NarrativeParseResult = ParsedNarrative & {
  lock_type?: LockType
  /** 0–1: how strongly the heuristic parser matched structured patterns */
  parse_confidence?: number
}

/**
 * API / spec shape for suggested moves (Phase 2). Not the full registry TransformationMove row.
 */
export interface NarrativeTransformationMove {
  moveId: string
  moveType: 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
  prompt: string
  targetEffect?: string
  sourceParseId?: string
}

/** Quest seed bundle (Phase 4) — spec contract */
export interface NarrativeQuestSeed {
  questSeedType: 'narrative_transformation'
  wake_prompt: string
  cleanup_prompt: string
  grow_prompt: string
  show_objective: string
  bar_prompt: string
  /** Nation move profile one-liner when `nationId` is passed to seed generation */
  nation_flavor?: string
  /** Archetype move-style hint when archetype key resolves */
  archetype_style?: string
  /** From nation profile when `nationId` is provided — feeds `{emotion_channel}` in move templates */
  emotion_channel?: EmotionChannel
  /** Stable nation key (e.g. `argyra`) when a profile was applied */
  nation_move_profile_id?: string
  /** Tags from nation profile (investigation, trials, …) */
  quest_flavor_tags?: string[]
  /** Tags from archetype move style (EG) — quest feel modifiers */
  archetype_quest_style_tags?: string[]
}
