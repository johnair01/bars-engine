/**
 * Transformation Move Library v1 — nation overlay
 * Spec: .specify/specs/transformation-move-library/spec.md (Phase 2)
 * Docs: docs/architecture/nation-move-profiles.md
 */

import type { EmotionChannel, WcgsStage } from '@/lib/transformation-move-registry/types'
import type { NarrativeQuestSeed } from '../types'
import type { ElementKey } from '@/lib/game/nations'
import { getNationById, NATIONS } from '@/lib/game/nations'

/** @alias Spec name: Nation Move Profile (EF) */
export type NationMoveProfile = NationMoveProfileV1

export interface NationMoveProfileV1 {
  nationId: string
  displayName: string
  element: ElementKey
  emotionChannel: EmotionChannel
  /** WCGS stages this nation emphasizes (ordering / rhythm). */
  developmentalEmphasis: WcgsStage[]
  preferredMoves: string[]
  moveStyleModifiers: string[]
  questFlavorModifiers: string[]
  exampleMoveFlavors: string[]
  /** One-line quest flavor from architecture doc (table). */
  questFlavorOneLiner: string
}

export const NATION_MOVE_PROFILES: Record<string, NationMoveProfileV1> = {
  argyra: {
    nationId: 'argyra',
    displayName: 'Argyra',
    element: 'metal',
    emotionChannel: 'fear',
    developmentalEmphasis: ['wake_up', 'grow_up'],
    preferredMoves: ['pattern_recognition', 'system_observation', 'truth_clarification', 'boundary_detection'],
    moveStyleModifiers: ['precision', 'strategic_awareness', 'calm_observation'],
    questFlavorModifiers: ['investigation', 'mapping_systems', 'strategic_insight'],
    exampleMoveFlavors: [
      'What pattern is this fear revealing?',
      'What boundary is asking to be seen?',
      'What signal is this fear trying to clarify?',
    ],
    questFlavorOneLiner:
      'Investigate the pattern beneath your fear. Map the system producing this experience.',
  },
  pyrakanth: {
    nationId: 'pyrakanth',
    displayName: 'Pyrakanth',
    element: 'fire',
    emotionChannel: 'anger',
    developmentalEmphasis: ['clean_up', 'show_up'],
    preferredMoves: ['shadow_confrontation', 'boundary_assertion', 'action_challenge', 'courage_experiments'],
    moveStyleModifiers: ['directness', 'intensity', 'challenge'],
    questFlavorModifiers: ['trials', 'courage_tests', 'breakthrough_actions'],
    exampleMoveFlavors: [
      'What boundary is anger demanding?',
      'What action is waiting to be taken?',
      'What truth is asking to be spoken?',
    ],
    questFlavorOneLiner: 'Take one courageous action that asserts your boundary.',
  },
  lamenth: {
    nationId: 'lamenth',
    displayName: 'Lamenth',
    element: 'water',
    emotionChannel: 'sadness',
    developmentalEmphasis: ['clean_up', 'wake_up'],
    preferredMoves: ['grief_dialogue', 'emotional_witnessing', 'story_excavation', 'memory_reflection'],
    moveStyleModifiers: ['gentleness', 'depth', 'compassion'],
    questFlavorModifiers: ['reflection', 'journaling', 'storytelling'],
    exampleMoveFlavors: [
      'What loss is asking to be honored?',
      'What story beneath the sadness wants to be heard?',
      'What truth is surfacing through grief?',
    ],
    questFlavorOneLiner: 'Write the story beneath this sadness.',
  },
  meridia: {
    nationId: 'meridia',
    displayName: 'Meridia',
    element: 'earth',
    emotionChannel: 'neutrality',
    developmentalEmphasis: ['grow_up', 'wake_up'],
    preferredMoves: ['perspective_balancing', 'systems_thinking', 'integration_reflection'],
    moveStyleModifiers: ['groundedness', 'balance', 'stability'],
    questFlavorModifiers: ['mediation', 'systems_reflection', 'balance_quests'],
    exampleMoveFlavors: [
      'What perspective might balance this situation?',
      'What holds all sides of this experience?',
      'What remains steady beneath this moment?',
    ],
    questFlavorOneLiner: 'What perspective might balance this situation?',
  },
  virelune: {
    nationId: 'virelune',
    displayName: 'Virelune',
    element: 'wood',
    emotionChannel: 'joy',
    developmentalEmphasis: ['wake_up', 'show_up'],
    preferredMoves: ['creative_reframing', 'possibility_generation', 'playful_experimentation'],
    moveStyleModifiers: ['playfulness', 'imagination', 'optimism'],
    questFlavorModifiers: ['creative_quests', 'exploration', 'discovery'],
    exampleMoveFlavors: [
      'What possibility is hidden here?',
      'What new path could grow from this moment?',
      'What experiment would feel joyful to try?',
    ],
    questFlavorOneLiner: 'Experiment with a joyful new approach.',
  },
}

/**
 * Ordered registry `move_id` preferences per WCGS stage for move selection (tie-break after lock filter).
 * Derived from nation-move-profiles emphasis + canonical registry ids.
 */
export const NATION_STAGE_MOVE_PREFERENCE: Record<string, Partial<Record<WcgsStage, string[]>>> = {
  argyra: {
    wake_up: ['observe', 'name'],
    clean_up: ['externalize', 'feel'],
    grow_up: ['reframe', 'invert'],
    show_up: ['experiment', 'integrate'],
  },
  pyrakanth: {
    wake_up: ['name', 'observe'],
    clean_up: ['feel', 'externalize'],
    grow_up: ['invert', 'reframe'],
    show_up: ['experiment', 'integrate'],
  },
  lamenth: {
    wake_up: ['observe', 'name'],
    clean_up: ['externalize', 'feel'],
    grow_up: ['reframe', 'invert'],
    show_up: ['experiment', 'integrate'],
  },
  meridia: {
    wake_up: ['name', 'observe'],
    clean_up: ['feel', 'externalize'],
    grow_up: ['reframe', 'invert'],
    show_up: ['experiment', 'integrate'],
  },
  virelune: {
    wake_up: ['observe', 'name'],
    clean_up: ['externalize', 'feel'],
    grow_up: ['invert', 'reframe'],
    show_up: ['experiment', 'integrate'],
  },
}

export function getNationMoveProfile(nationId: string | null | undefined): NationMoveProfileV1 | undefined {
  if (!nationId?.trim()) return undefined
  const key = nationId.toLowerCase().trim()
  if (NATION_MOVE_PROFILES[key]) return NATION_MOVE_PROFILES[key]
  const nation = getNationById(key)
  return nation ? NATION_MOVE_PROFILES[nation.id] : undefined
}

/** Five registry move ids (wake / clean / grow / show / integrate) — overlay input. */
export type NationMoveIdBundle = {
  wake: string
  clean: string
  grow: string
  show: string
  integrate: string
}

function coerceStageOrder(stage: WcgsStage, currentId: string, nationKey: string): string {
  const order = NATION_STAGE_MOVE_PREFERENCE[nationKey]?.[stage]
  if (!order?.length) return currentId
  if (order.includes(currentId)) return currentId
  return order[0]
}

/**
 * Re-align a move bundle to this nation's per-stage preferences (FR4).
 * If a stage's move id is not in the nation's preference list, it is replaced with the first preferred id.
 */
export function applyNationOverlay(bundle: NationMoveIdBundle, profile: NationMoveProfileV1): NationMoveIdBundle {
  const nk = profile.nationId
  return {
    wake: coerceStageOrder('wake_up', bundle.wake, nk),
    clean: coerceStageOrder('clean_up', bundle.clean, nk),
    grow: coerceStageOrder('grow_up', bundle.grow, nk),
    show: coerceStageOrder('show_up', bundle.show, nk),
    integrate: bundle.integrate,
  }
}

/**
 * Merge nation identity into a flat quest seed (FR5 / Phase 3).
 * Safe to call when no profile (no-op).
 */
export function applyNationQuestFlavor(
  seed: NarrativeQuestSeed,
  profile?: NationMoveProfileV1
): NarrativeQuestSeed {
  if (!profile) return seed
  return {
    ...seed,
    emotion_channel: profile.emotionChannel,
    nation_move_profile_id: profile.nationId,
    quest_flavor_tags: profile.questFlavorModifiers,
    nation_flavor: seed.nation_flavor ?? profile.questFlavorOneLiner,
  }
}

/** All nation ids that have a move profile (matches NATIONS keys). */
export function listNationIdsWithProfiles(): string[] {
  return Object.keys(NATIONS)
}
