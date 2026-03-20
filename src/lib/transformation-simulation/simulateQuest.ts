/**
 * Transformation Simulation Harness — quest mode (FN / DT follow-on).
 * Narrative → lock + encounter geometry + registry quest seed (deterministic when `seed` set).
 *
 * @see .specify/specs/transformation-simulation-harness/spec.md
 */

import { getNationById } from '@/lib/game/nations'
import { runNarrativeTransformationFull } from '@/lib/narrative-transformation/fullPipeline'
import type { BuildQuestSeedOptions } from '@/lib/narrative-transformation/seedFromNarrative'
import {
  computeGeometryMatchScore,
  interpretCoordinate,
} from '@/lib/transformation-encounter-geometry/services'
import { ENCOUNTER_TYPES } from '@/lib/transformation-encounter-geometry/encounter-types'
import type { QuestSeed, QuestSeedArc } from '@/lib/transformation-move-registry/types'
import { resolvePlaybookArchetypeKey } from '@/lib/narrative-transformation/moves/archetype-profiles'

export type SimulateQuestInput = {
  nationId?: string | null
  archetypeKey?: string | null
  /** Display names for template placeholders */
  nationName?: string | null
  archetypeName?: string | null
  /** Same narrative + seed → same quest_seed_id and pipeline outputs (move order is already deterministic). */
  seed?: number
}

/** Aligns with spec SimulationResult + simulation_id; excludes agent-only fields. */
export type SimulateQuestResult = {
  simulation_id: string
  seed?: number
  narrative_input: string
  lock_type: string
  encounter_geometry: {
    ranked_encounters: Array<{
      encounter_id: string
      name: string
      match_score: number
      coordinate_summary: string
    }>
    top_coordinate_summary: string | null
  }
  quest_template: Record<string, unknown>
  moves_selected: string[]
  generated_prompts: Record<string, string>
  bar_generated?: {
    move_id: string
    bar_prompt: string
    bar_type: string
  }
  parse_summary: {
    actor: string
    state: string
    object: string
    confidence: number
  }
  hints: Record<string, unknown>
}

function djb2Hash(str: string, seed: number): string {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(16)
}

function stableSimulationId(narrative: string, seed: number): string {
  return `sim_quest_${seed}_${djb2Hash(narrative.trim(), seed)}`
}

function collectMoveIds(arc: QuestSeedArc): string[] {
  const out: string[] = []
  if (arc.wake) out.push(arc.wake.move_id)
  if (arc.clean) out.push(arc.clean.move_id)
  if (arc.grow) out.push(arc.grow.move_id)
  if (arc.show) out.push(arc.show.move_id)
  if (arc.integrate) out.push(arc.integrate.move_id)
  return out
}

function collectPrompts(arc: QuestSeedArc): Record<string, string> {
  const p: Record<string, string> = {}
  if (arc.wake) p.wake = arc.wake.prompt
  if (arc.clean) p.clean = arc.clean.prompt
  if (arc.grow) p.grow = arc.grow.prompt
  if (arc.show) p.show = arc.show.prompt
  return p
}

/**
 * Run quest simulation: full narrative transformation + encounter geometry ranking.
 */
export function simulateQuest(narrative: string, options?: SimulateQuestInput): SimulateQuestResult {
  const text = (narrative ?? '').trim()
  const seed = options?.seed ?? 0
  if (!text) {
    throw new Error('simulateQuest: narrative is required')
  }

  const nationId = options?.nationId?.trim().toLowerCase()
  const resolvedNation = nationId ? getNationById(nationId) : undefined
  const nationNameOpt =
    options?.nationName ?? resolvedNation?.name ?? null

  const archSlug = resolvePlaybookArchetypeKey(options?.archetypeKey ?? '')

  const buildOpts: BuildQuestSeedOptions = {
    nationId: resolvedNation?.id ?? nationId ?? null,
    archetypeKey: archSlug ?? options?.archetypeKey ?? null,
    nationName: nationNameOpt,
    archetypeName: options?.archetypeName ?? null,
  }

  const full = runNarrativeTransformationFull(text, buildOpts)
  const simId = stableSimulationId(text, seed)

  const questSeed: QuestSeed = {
    ...full.questSeed,
    quest_seed_id: simId,
  }

  const nationForGeom = resolvedNation?.id ?? nationId
  const archForGeom = archSlug ?? options?.archetypeKey ?? undefined

  const ranked = [...ENCOUNTER_TYPES]
    .map((e) => ({
      encounter_id: e.encounter_id,
      name: e.name,
      match_score: computeGeometryMatchScore(e.coordinate, nationForGeom, archForGeom),
      coordinate_summary: interpretCoordinate(e.coordinate),
    }))
    .sort((a, b) => b.match_score - a.match_score)

  const top = ranked[0]

  const bar =
    questSeed.arc.integrate && questSeed.arc.integrate.move_id
      ? {
          move_id: questSeed.arc.integrate.move_id,
          bar_prompt: questSeed.arc.integrate.bar_prompt,
          bar_type: questSeed.arc.integrate.bar_type,
        }
      : undefined

  return {
    simulation_id: simId,
    seed: options?.seed,
    narrative_input: text,
    lock_type: questSeed.lock_type,
    encounter_geometry: {
      ranked_encounters: ranked.slice(0, 8),
      top_coordinate_summary: top ? top.coordinate_summary : null,
    },
    quest_template: questSeed as unknown as Record<string, unknown>,
    moves_selected: collectMoveIds(questSeed.arc),
    generated_prompts: collectPrompts(questSeed.arc),
    bar_generated: bar,
    parse_summary: {
      actor: full.parse.actor,
      state: full.parse.state,
      object: full.parse.object,
      confidence: full.parse.confidence ?? 0,
    },
    hints: full.hints as unknown as Record<string, unknown>,
  }
}
