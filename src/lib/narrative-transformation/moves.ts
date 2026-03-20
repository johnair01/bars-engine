/**
 * Default move-id selection for narrative transformation → transformation-move-registry.
 * Spec: .specify/specs/narrative-transformation-engine/plan.md
 */

import { CANONICAL_MOVES } from '@/lib/transformation-move-registry/registry'
import type { LockType, TransformationMove, WcgsStage } from '@/lib/transformation-move-registry/types'
import type { NarrativeParseResult } from './types'

export type DefaultMoveIdBundle = {
  wake: string
  clean: string
  grow: string
  show: string
  integrate: string
}

const DEFAULT_LOCK: LockType = 'emotional_lock'

function pickFirstForStage(
  lock: LockType,
  stage: WcgsStage,
  excludeIds: Set<string>
): TransformationMove | undefined {
  const match = CANONICAL_MOVES.find(
    (m) =>
      m.wcgs_stage === stage &&
      m.compatible_lock_types.includes(lock) &&
      !excludeIds.has(m.move_id)
  )
  if (match) return match

  return CANONICAL_MOVES.find(
    (m) => m.wcgs_stage === stage && !excludeIds.has(m.move_id)
  )
}

/**
 * Select canonical registry `move_id`s for wake / clean / grow / show / integrate.
 * When lock is missing, uses `emotional_lock`. If a stage has no lock-compatible move,
 * falls back to any move in that WCGS stage (then registry order).
 */
export function selectDefaultMoveIds(
  parsed: NarrativeParseResult,
  opts?: {
    overrides?: Partial<DefaultMoveIdBundle>
  }
): DefaultMoveIdBundle {
  const lock = parsed.lock_type ?? DEFAULT_LOCK
  const overrides = opts?.overrides ?? {}

  const wake =
    overrides.wake ??
    pickFirstForStage(lock, 'wake_up', new Set())?.move_id ??
    'observe'

  const clean =
    overrides.clean ??
    pickFirstForStage(lock, 'clean_up', new Set())?.move_id ??
    'externalize'

  const grow =
    overrides.grow ??
    pickFirstForStage(lock, 'grow_up', new Set())?.move_id ??
    'reframe'

  const showPreferred = pickFirstForStage(lock, 'show_up', new Set(['integrate']))
  const show =
    overrides.show ??
    showPreferred?.move_id ??
    CANONICAL_MOVES.find((m) => m.wcgs_stage === 'show_up' && m.move_id === 'experiment')?.move_id ??
    'experiment'

  const integrate =
    overrides.integrate ??
    CANONICAL_MOVES.find((m) => m.move_id === 'integrate')?.move_id ??
    'integrate'

  return { wake, clean, grow, show, integrate }
}
