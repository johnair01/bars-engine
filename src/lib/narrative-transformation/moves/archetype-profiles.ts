/**
 * Transformation Move Library v1 — archetype selection bias (playbook slugs)
 * Spec: .specify/specs/transformation-move-library/spec.md (Phase 3 integration)
 *
 * Display names, overlay behavior, and agency copy live in **archetype-influence-overlay**
 * (`ARCHETYPE_PROFILES`). This module only adds **registry move_id selection** bias keyed by the
 * same `archetype_id` values — single roster, two concerns.
 */

import { ARCHETYPE_PROFILES } from '@/lib/archetype-influence-overlay/profiles'
import type { ArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay/types'
import type { WcgsStage } from '@/lib/transformation-move-registry/types'

export interface ArchetypeMoveProfileV1 {
  /** Playbook slug (e.g. truth-seer, bold-heart). */
  archetype_id: string
  /** Human-readable style line (derived from overlay quest/agency strings). */
  move_style: string
  preferred_core_moves: WcgsStage[]
  /** When a stage is in preferred_core_moves, bias selection toward these registry move_ids. */
  stage_move_pref?: Partial<Record<WcgsStage, string[]>>
}

/**
 * Selection bias only — must have one entry per row in `ARCHETYPE_PROFILES`.
 * When adding a playbook in archetype-influence-overlay, add a key here or startup will throw in dev.
 */
const SELECTION_BIAS: Record<
  string,
  {
    preferred_core_moves: WcgsStage[]
    stage_move_pref?: Partial<Record<WcgsStage, string[]>>
  }
> = {
  'bold-heart': {
    preferred_core_moves: ['wake_up', 'show_up'],
    stage_move_pref: {
      wake_up: ['name', 'observe'],
      show_up: ['experiment', 'integrate'],
    },
  },
  'danger-walker': {
    preferred_core_moves: ['wake_up', 'clean_up'],
    stage_move_pref: {
      wake_up: ['observe', 'name'],
      clean_up: ['externalize', 'feel'],
    },
  },
  'truth-seer': {
    preferred_core_moves: ['wake_up', 'grow_up'],
    stage_move_pref: {
      wake_up: ['observe', 'name'],
      grow_up: ['reframe', 'invert'],
    },
  },
  'still-point': {
    preferred_core_moves: ['clean_up', 'grow_up'],
    stage_move_pref: {
      clean_up: ['feel', 'externalize'],
      grow_up: ['reframe', 'invert'],
    },
  },
  'subtle-influence': {
    preferred_core_moves: ['grow_up', 'show_up'],
    stage_move_pref: {
      grow_up: ['invert', 'reframe'],
      show_up: ['experiment', 'integrate'],
    },
  },
  'devoted-guardian': {
    preferred_core_moves: ['clean_up', 'show_up'],
    stage_move_pref: {
      clean_up: ['feel', 'externalize'],
      show_up: ['experiment', 'integrate'],
    },
  },
  'decisive-storm': {
    preferred_core_moves: ['show_up', 'grow_up'],
    stage_move_pref: {
      grow_up: ['invert', 'reframe'],
      show_up: ['experiment', 'integrate'],
    },
  },
  'joyful-connector': {
    preferred_core_moves: ['wake_up', 'show_up'],
    stage_move_pref: {
      wake_up: ['observe', 'name'],
      show_up: ['experiment', 'integrate'],
    },
  },
}

function mergeProfile(base: ArchetypeInfluenceProfile): ArchetypeMoveProfileV1 {
  const bias = SELECTION_BIAS[base.archetype_id]
  if (!bias) {
    throw new Error(
      `[archetype-profiles] Missing SELECTION_BIAS for "${base.archetype_id}". ` +
        'Add an entry alongside new ARCHETYPE_PROFILES rows.'
    )
  }
  const move_style = [
    base.agency_pattern[0],
    base.agency_pattern[1],
    base.quest_style_modifiers[0],
  ]
    .filter(Boolean)
    .join(' — ')
  return {
    archetype_id: base.archetype_id,
    move_style,
    preferred_core_moves: bias.preferred_core_moves,
    stage_move_pref: bias.stage_move_pref,
  }
}

/** Merged view: overlay identity + library selection bias (deduplicated roster). */
export const ARCHETYPE_MOVE_PROFILES: ArchetypeMoveProfileV1[] = ARCHETYPE_PROFILES.map(mergeProfile)

/**
 * Diagnostic / signal keys (`ARCHETYPE_KEYS` snake_case) → playbook slug for transformation.
 * @see docs/architecture/archetype-key-reconciliation.md
 * @see .specify/specs/archetype-key-resolution/spec.md — `ARCHETYPE_KEY_TO_PLAYBOOK_SLUG`
 */
export const ARCHETYPE_KEY_TO_PLAYBOOK_SLUG: Record<string, string> = {
  truth_seer: 'truth-seer',
  shadow_walker: 'danger-walker',
  bridge_builder: 'joyful-connector',
  flame_keeper: 'bold-heart',
  dream_weaver: 'subtle-influence',
  story_teller: 'joyful-connector',
  root_tender: 'devoted-guardian',
  void_dancer: 'still-point',
}

const PLAYBOOK_SLUGS = new Set(ARCHETYPE_MOVE_PROFILES.map((p) => p.archetype_id))

/**
 * Normalize archetype input to a playbook slug when possible.
 * Accepts playbook slug (`truth-seer`), display-ish keys, or diagnostic `ARCHETYPE_KEYS` (`truth_seer`).
 */
export function resolvePlaybookArchetypeKey(archetypeKeyOrName: string | null | undefined): string | undefined {
  if (!archetypeKeyOrName?.trim()) return undefined
  const raw = archetypeKeyOrName.trim().toLowerCase()
  if (PLAYBOOK_SLUGS.has(raw)) return raw
  const fromSignal = ARCHETYPE_KEY_TO_PLAYBOOK_SLUG[raw]
  if (fromSignal && PLAYBOOK_SLUGS.has(fromSignal)) return fromSignal
  return undefined
}

/**
 * EI spec entrypoint: same as {@link resolvePlaybookArchetypeKey} but returns `null` when unresolvable.
 */
export function resolveArchetypeKeyForTransformation(key: string | null | undefined): string | null {
  return resolvePlaybookArchetypeKey(key) ?? null
}

export function getArchetypeMoveProfile(slug: string | null | undefined): ArchetypeMoveProfileV1 | undefined {
  const s = resolvePlaybookArchetypeKey(slug ?? '')
  if (!s) return undefined
  return ARCHETYPE_MOVE_PROFILES.find((p) => p.archetype_id === s)
}
