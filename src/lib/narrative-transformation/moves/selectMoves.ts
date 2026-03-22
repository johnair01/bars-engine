/**
 * Transformation Move Library v1 — selection + WCGS quest seed helpers
 * Spec: .specify/specs/transformation-move-library/spec.md (Phase 4)
 */

import { CANONICAL_MOVES } from '@/lib/transformation-move-registry/registry'
import {
  assembleQuestSeed,
  getMoveById,
} from '@/lib/transformation-move-registry/services'
import type {
  LockType,
  ParsedNarrative,
  QuestSeed,
  TransformationMove,
  WcgsStage,
} from '@/lib/transformation-move-registry/types'
import type { NarrativeParseResult } from '../types'
import type { NarrativeQuestSeed } from '../types'
import { getArchetypeMoveProfile, resolvePlaybookArchetypeKey } from './archetype-profiles'
import { applyArchetypeOverlay, applyArchetypeQuestFlavor } from './archetype-move-styles'
import {
  applyNationQuestFlavor,
  getNationMoveProfile,
  NATION_STAGE_MOVE_PREFERENCE,
} from './nation-profiles'

const DEFAULT_LOCK: LockType = 'emotional_lock'

export type DefaultMoveIdBundle = {
  wake: string
  clean: string
  grow: string
  show: string
  integrate: string
}

function toRegistryParsed(parsed: NarrativeParseResult): ParsedNarrative {
  return {
    raw_text: parsed.raw_text,
    actor: parsed.actor,
    state: parsed.state,
    object: parsed.object,
    negations: parsed.negations,
    confidence: parsed.confidence,
  }
}

function pickForStage(
  lock: LockType,
  stage: WcgsStage,
  excludeIds: Set<string>,
  nationKey: string | undefined,
  archetypeKey: string | undefined
): TransformationMove | undefined {
  let candidates = CANONICAL_MOVES.filter(
    (m) =>
      m.wcgs_stage === stage &&
      !excludeIds.has(m.move_id) &&
      m.compatible_lock_types.includes(lock)
  )
  if (!candidates.length) {
    candidates = CANONICAL_MOVES.filter((m) => m.wcgs_stage === stage && !excludeIds.has(m.move_id))
  }

  const resolvedArch = resolvePlaybookArchetypeKey(archetypeKey ?? '')
  const archProfile = resolvedArch ? getArchetypeMoveProfile(resolvedArch) : undefined
  const prefersStage = archProfile?.preferred_core_moves.includes(stage) ? archProfile : undefined
  const nationOrder = nationKey ? NATION_STAGE_MOVE_PREFERENCE[nationKey]?.[stage] : undefined
  const archOrder = prefersStage ? prefersStage.stage_move_pref?.[stage] : undefined

  const nationScore = (m: TransformationMove) => {
    if (!nationOrder) return 0
    const i = nationOrder.indexOf(m.move_id)
    return i >= 0 ? 100 - i : 0
  }

  const archScoreOnly = (m: TransformationMove) => {
    if (!archOrder) return 0
    const i = archOrder.indexOf(m.move_id)
    return i >= 0 ? 20 - i : 0
  }

  const totalScore = (m: TransformationMove) => nationScore(m) + archScoreOnly(m)

  const registryIndex = (m: TransformationMove) => CANONICAL_MOVES.findIndex((x) => x.move_id === m.move_id)

  candidates.sort((a, b) => {
    const d = totalScore(b) - totalScore(a)
    if (d !== 0) return d
    const da = archScoreOnly(b) - archScoreOnly(a)
    if (da !== 0) return da
    // Preserve canonical registry ordering when unbiased (matches pre-library `CANONICAL_MOVES.find` behavior).
    return registryIndex(a) - registryIndex(b)
  })
  return candidates[0]
}

export type SelectLibraryMovesOpts = {
  nationId?: string | null
  archetypeKey?: string | null
  overrides?: Partial<DefaultMoveIdBundle>
}

/**
 * Select registry move ids: lock → nation ordering → archetype bias → defaults.
 * Compatible with `assembleQuestSeed` / narrative transformation pipeline.
 */
export function selectDefaultMoveIds(parsed: NarrativeParseResult, opts?: SelectLibraryMovesOpts): DefaultMoveIdBundle {
  const lock = parsed.lock_type ?? DEFAULT_LOCK
  const nationKey = opts?.nationId?.trim().toLowerCase()
  const nationForPrefs = nationKey && NATION_STAGE_MOVE_PREFERENCE[nationKey] ? nationKey : undefined
  const overrides = opts?.overrides ?? {}

  const wake =
    overrides.wake ?? pickForStage(lock, 'wake_up', new Set(), nationForPrefs, opts?.archetypeKey ?? undefined)?.move_id ?? 'observe'

  const clean =
    overrides.clean ??
    pickForStage(lock, 'clean_up', new Set(), nationForPrefs, opts?.archetypeKey ?? undefined)?.move_id ??
    'externalize'

  const grow =
    overrides.grow ??
    pickForStage(lock, 'grow_up', new Set(), nationForPrefs, opts?.archetypeKey ?? undefined)?.move_id ??
    'reframe'

  const show =
    overrides.show ??
    pickForStage(lock, 'show_up', new Set(['integrate']), nationForPrefs, opts?.archetypeKey ?? undefined)
      ?.move_id ??
    'experiment'

  const integrate =
    overrides.integrate ??
    CANONICAL_MOVES.find((m) => m.move_id === 'integrate')?.move_id ??
    'integrate'

  return applyArchetypeOverlay({ wake, clean, grow, show, integrate }, opts?.archetypeKey ?? null)
}

/** Return the five registry move rows (wake, clean, grow, show, integrate) in order. */
export function selectMoves(parsed: NarrativeParseResult, opts?: SelectLibraryMovesOpts): TransformationMove[] {
  const bundle = selectDefaultMoveIds(parsed, opts)
  const rows = [
    getMoveById(bundle.wake),
    getMoveById(bundle.clean),
    getMoveById(bundle.grow),
    getMoveById(bundle.show),
    getMoveById(bundle.integrate),
  ].filter(Boolean) as TransformationMove[]
  return rows
}

export type GenerateQuestSeedOpts = SelectLibraryMovesOpts & {
  /** Passed through to assembleQuestSeed (alchemy overlay, display names). */
  renderNationName?: string | null
  renderArchetypeName?: string | null
  emotionChannel?: string | null
  /** When set, skip selection and use this bundle (e.g. after `selectMoves`). */
  moveIds?: DefaultMoveIdBundle
}

/**
 * Full registry QuestSeed after library selection + assembly (includes archetype overlay when key set).
 */
export function generateRegistryQuestSeed(parsed: NarrativeParseResult, opts?: GenerateQuestSeedOpts): QuestSeed {
  const lock = parsed.lock_type ?? DEFAULT_LOCK
  const narrative = toRegistryParsed(parsed)
  const moveIds = opts?.moveIds ?? selectDefaultMoveIds(parsed, opts)
  const nationProfile = getNationMoveProfile(opts?.nationId)

  const renderContext =
    opts?.emotionChannel ||
    opts?.renderNationName ||
    opts?.renderArchetypeName ||
    nationProfile
      ? {
          emotion_channel: opts?.emotionChannel ?? nationProfile?.emotionChannel ?? undefined,
          nation_name: opts?.renderNationName ?? nationProfile?.displayName ?? undefined,
          archetype_name: opts?.renderArchetypeName ?? undefined,
        }
      : undefined

  return assembleQuestSeed(narrative, lock, moveIds, {
    archetypeKey: opts?.archetypeKey ?? undefined,
    renderContext,
  })
}

/**
 * Flat WCGS-aligned quest seed (API / integrations); prompts rendered from selected moves.
 */
export function generateQuestSeed(parsed: NarrativeParseResult, opts?: GenerateQuestSeedOpts): NarrativeQuestSeed {
  const quest = generateRegistryQuestSeed(parsed, opts)
  const nationProfile = getNationMoveProfile(opts?.nationId)
  const arch = resolvePlaybookArchetypeKey(opts?.archetypeKey ?? '')
  const archProf = arch ? getArchetypeMoveProfile(arch) : undefined

  const flat: NarrativeQuestSeed = {
    questSeedType: 'narrative_transformation',
    wake_prompt: quest.arc.wake?.prompt ?? '',
    cleanup_prompt: quest.arc.clean?.prompt ?? '',
    grow_prompt: quest.arc.grow?.prompt ?? '',
    show_objective: quest.arc.show?.prompt ?? '',
    bar_prompt: quest.arc.integrate?.bar_prompt ?? '',
    nation_flavor: nationProfile?.questFlavorOneLiner,
    archetype_style: archProf?.move_style,
  }
  return applyArchetypeQuestFlavor(applyNationQuestFlavor(flat, nationProfile), opts?.archetypeKey ?? null)
}
