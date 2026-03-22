/**
 * Archetype Move Styles v0 (EG)
 * Spec: .specify/specs/archetype-move-styles/spec.md
 *
 * Rich playbook metadata + overlay helpers. Selection bias remains in archetype-profiles (SELECTION_BIAS).
 */

import { ARCHETYPE_PROFILES } from '@/lib/archetype-influence-overlay/profiles'
import type { NarrativeQuestSeed } from '../types'
import { getArchetypeMoveProfile, resolvePlaybookArchetypeKey } from './archetype-profiles'
import type { NationMoveIdBundle } from './nation-profiles'

/** EG spec contract — 8 playbook-linked archetypes */
export interface ArchetypeMoveStyle {
  archetypeId: string
  trigram: string
  systemName: string
  agencyStyle: string[]
  /** WCGS stages this archetype emphasizes (wake_up, clean_up, …) */
  preferredMoveExpression: string[]
  actionPatterns: string[]
  promptModifiers: string[]
  questStyleModifiers: string[]
  compatibleSuperpowerExtensions?: string[]
}

function buildArchetypeMoveStyle(slug: string): ArchetypeMoveStyle | undefined {
  const base = ARCHETYPE_PROFILES.find((p) => p.archetype_id === slug)
  const moveProf = getArchetypeMoveProfile(slug)
  if (!base || !moveProf) return undefined
  return {
    archetypeId: base.archetype_id,
    trigram: base.trigram,
    systemName: base.archetype_name,
    agencyStyle: base.agency_pattern,
    preferredMoveExpression: moveProf.preferred_core_moves,
    actionPatterns: [...base.action_style, ...base.reflection_style],
    promptModifiers: base.prompt_modifiers,
    questStyleModifiers: base.quest_style_modifiers,
    compatibleSuperpowerExtensions: undefined,
  }
}

/** All eight playbook styles (order follows ARCHETYPE_PROFILES). */
export const ARCHETYPE_MOVE_STYLES: ArchetypeMoveStyle[] = ARCHETYPE_PROFILES.map((p) =>
  buildArchetypeMoveStyle(p.archetype_id)
).filter((x): x is ArchetypeMoveStyle => x != null)

/**
 * Resolve playbook slug (or diagnostic key) → full EG profile.
 */
export function getArchetypeMoveStyle(archetypeKey: string | null | undefined): ArchetypeMoveStyle | undefined {
  const slug = resolvePlaybookArchetypeKey(archetypeKey ?? '')
  if (!slug) return undefined
  return buildArchetypeMoveStyle(slug)
}

function coerceStage(current: string, order: string[] | undefined): string {
  if (!order?.length) return current
  if (order.includes(current)) return current
  return order[0]
}

/**
 * Re-align a move bundle to this archetype’s per-stage registry preferences (FR4).
 * Complements in-selection scoring in `pickForStage`; use when healing an external bundle.
 */
export function applyArchetypeOverlay(
  bundle: NationMoveIdBundle,
  archetypeKey: string | null | undefined
): NationMoveIdBundle {
  const prof = getArchetypeMoveProfile(archetypeKey)
  const p = prof?.stage_move_pref
  if (!p) return bundle
  return {
    wake: coerceStage(bundle.wake, p.wake_up),
    clean: coerceStage(bundle.clean, p.clean_up),
    grow: coerceStage(bundle.grow, p.grow_up),
    show: coerceStage(bundle.show, p.show_up),
    integrate: bundle.integrate,
  }
}

/**
 * Enrich flat quest seed with archetype quest flavor (FR5 / T3.2).
 * Runs after `archetype_style` is set from `ArchetypeMoveProfileV1.move_style`.
 */
export function applyArchetypeQuestFlavor(
  seed: NarrativeQuestSeed,
  archetypeKey: string | null | undefined
): NarrativeQuestSeed {
  const style = getArchetypeMoveStyle(archetypeKey)
  if (!style) return seed
  const tags = style.questStyleModifiers.slice(0, 3).join(', ')
  const archetype_style = seed.archetype_style?.trim()
    ? `${seed.archetype_style} · (${tags})`
    : `${style.systemName} — ${style.promptModifiers[0] ?? ''}`.trim()

  return {
    ...seed,
    archetype_style,
    archetype_quest_style_tags: style.questStyleModifiers,
  }
}
