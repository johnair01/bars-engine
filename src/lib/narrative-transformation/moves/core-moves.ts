/**
 * Transformation Move Library v1 — core WCGS layer (teaching / traceability only)
 * Spec: .specify/specs/transformation-move-library/spec.md (Phase 1)
 *
 * **Not a second catalog.** Authoritative move rows are only in
 * `src/lib/transformation-move-registry/registry.ts`. This file maps spec “logical” anchor names
 * to registry `move_id`s and exposes `substituteTemplateVars` (delegates to registry).
 */

import type { LockType } from '@/lib/transformation-move-registry/types'
import { renderPromptTemplate } from '@/lib/transformation-move-registry/services'
import type { ParsedNarrative } from '@/lib/transformation-move-registry/types'

export type PersonalMoveType = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
export type MoveLayer = 'core' | 'nation' | 'archetype'

/** Spec EE §Layer 1 example ids → registry anchor (one primary move per WCGS stage). */
export const CORE_SPEC_ANCHORS = {
  wake_observe_pattern: { registryMoveId: 'observe', wcgsStage: 'wake_up' as const },
  cleanup_shadow_dialogue: { registryMoveId: 'externalize', wcgsStage: 'clean_up' as const },
  grow_reframe: { registryMoveId: 'reframe', wcgsStage: 'grow_up' as const },
  show_small_action: { registryMoveId: 'experiment', wcgsStage: 'show_up' as const },
} as const

export type CoreSpecAnchorKey = keyof typeof CORE_SPEC_ANCHORS

/** Library-facing row (lighter than full registry TransformationMove). */
export interface LibraryCoreMove {
  moveId: string
  specAnchorKey: CoreSpecAnchorKey
  moveType: PersonalMoveType
  moveLayer: 'core'
  promptTemplate: string
  compatibleLockTypes?: LockType[]
  description?: string
}

export const CORE_WCGS_LIBRARY_MOVES: LibraryCoreMove[] = [
  {
    moveId: 'observe',
    specAnchorKey: 'wake_observe_pattern',
    moveType: 'wake_up',
    moveLayer: 'core',
    description: 'Increase awareness of a narrative pattern.',
    promptTemplate: 'What story are you telling yourself about {object}?',
    compatibleLockTypes: ['identity_lock', 'emotional_lock', 'possibility_lock'],
  },
  {
    moveId: 'externalize',
    specAnchorKey: 'cleanup_shadow_dialogue',
    moveType: 'clean_up',
    moveLayer: 'core',
    description: 'Shadow / emotional charge as dialogue.',
    promptTemplate: 'If {state} could speak, what would it say?',
    compatibleLockTypes: ['identity_lock', 'emotional_lock'],
  },
  {
    moveId: 'reframe',
    specAnchorKey: 'grow_reframe',
    moveType: 'grow_up',
    moveLayer: 'core',
    description: 'Expand perspective and cognitive flexibility.',
    promptTemplate: 'What might {object} be trying to teach you?',
    compatibleLockTypes: ['identity_lock', 'possibility_lock', 'emotional_lock'],
  },
  {
    moveId: 'experiment',
    specAnchorKey: 'show_small_action',
    moveType: 'show_up',
    moveLayer: 'core',
    description: 'Translate insight into real-world action.',
    promptTemplate: 'What is one small action where {object} is allowed?',
    compatibleLockTypes: ['action_lock', 'possibility_lock', 'identity_lock'],
  },
]

/**
 * Substitute {actor}, {state}, {object} (and optional registry context tokens).
 * Delegates to transformation-move-registry renderer.
 */
export function substituteTemplateVars(
  template: string,
  narrative: ParsedNarrative,
  context?: { emotion_channel?: string; nation_name?: string; archetype_name?: string }
): string {
  return renderPromptTemplate(template, narrative, context)
}
