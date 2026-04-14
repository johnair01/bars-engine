/**
 * Move Library Accessor — typed access to the 52 canonical moves.
 *
 * 20 nation moves (5 nations × 4 WCGS stages)
 * 32 archetype moves (8 trigram archetypes × 4 WCGS stages)
 *
 * This is the canonical content source for nursery ritual flows.
 * Each move defines the game mechanics (core_prompt, reflection_schema, bar_integration)
 * that the Twee narrative wraps in face-voiced prose.
 */

import nationMovesJson from './move-library.json'
import archetypeMovesJson from './archetype-move-library.json'

// ─── Types ──────────────────────────────────────────────────────────────────

export type WcgsStage = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
export type MoveCategory = 'awareness' | 'emotional_processing' | 'behavioral_experiment' | 'action'
export type BarTiming = 'post_action' | 'completion'
export type BarType = 'insight' | 'vibe'
export type ArtifactType = 'knowledge' | 'meaning' | 'capacity' | 'completion'

export interface DomainTranslation {
  translated_name: string
  translated_prompt: string
  translated_action: string
  valid_completion: string
  artifact_emphasis: string
}

export interface BarIntegration {
  creates_bar: boolean
  bar_timing: BarTiming
  bar_type: BarType
  bar_prompt_template: string
  optional_tracking_bar: boolean
}

export interface VibeuloRules {
  base_reward: number
  stretch_bonus: number
  completion_required: boolean
  reflection_required: boolean
  max_reward: number
}

export interface ReflectionSchema {
  required_fields: string[]
  bar_prompt: string
  completion_check: string
}

export interface MoveDefinition {
  move_id: string
  move_name: string
  source_type: 'nation' | 'archetype'
  source_key: string
  level: number
  wcgs_stage: WcgsStage
  move_category: MoveCategory
  description: string
  purpose: string
  core_prompt: string
  target_effect: string
  typical_output_type: string
  artifact_type: ArtifactType
  domain_translations: Record<string, DomainTranslation>
  bar_integration: BarIntegration
  vibeulon_rules: VibeuloRules
  reflection_schema: ReflectionSchema
  tags: string[]
  status: string
}

// ─── Data ───────────────────────────────────────────────────────────────────

export const NATION_MOVES: readonly MoveDefinition[] = nationMovesJson as MoveDefinition[]
export const ARCHETYPE_MOVES: readonly MoveDefinition[] = archetypeMovesJson as MoveDefinition[]
export const ALL_MOVES: readonly MoveDefinition[] = [...NATION_MOVES, ...ARCHETYPE_MOVES]

// ─── Lookups ────────────────────────────────────────────────────────────────

const _byId = new Map<string, MoveDefinition>()
for (const m of ALL_MOVES) _byId.set(m.move_id, m)

/** Lookup a move by its canonical move_id. */
export function getMoveById(moveId: string): MoveDefinition | undefined {
  return _byId.get(moveId)
}

/** Get the nation move for a given nation key + WCGS stage. */
export function getNationMove(nationKey: string, stage: WcgsStage): MoveDefinition | undefined {
  return NATION_MOVES.find(
    m => m.source_key === nationKey && m.wcgs_stage === stage
  )
}

/** Get the archetype move for a given archetype key + WCGS stage. */
export function getArchetypeMove(archetypeKey: string, stage: WcgsStage): MoveDefinition | undefined {
  return ARCHETYPE_MOVES.find(
    m => m.source_key === archetypeKey && m.wcgs_stage === stage
  )
}

/** Get all 4 moves for a nation (one per WCGS stage). */
export function getNationMoveSet(nationKey: string): MoveDefinition[] {
  return NATION_MOVES.filter(m => m.source_key === nationKey)
}

/** Get all 4 moves for an archetype (one per WCGS stage). */
export function getArchetypeMoveSet(archetypeKey: string): MoveDefinition[] {
  return ARCHETYPE_MOVES.filter(m => m.source_key === archetypeKey)
}

/**
 * Resolve the move a player should do in a nursery.
 *
 * Resolution order:
 * 1. Nation move for (nationKey + wcgsStage) — always available
 * 2. Archetype move for (archetypeKey + wcgsStage) — when player has archetype
 *
 * Both are returned; the nursery UI can show the nation move as primary
 * and the archetype move as the personal variation.
 */
export function resolveNurseryMoves(
  nationKey: string,
  archetypeKey: string | null,
  wcgsStage: WcgsStage
): { nationMove: MoveDefinition | undefined; archetypeMove: MoveDefinition | undefined } {
  return {
    nationMove: getNationMove(nationKey, wcgsStage),
    archetypeMove: archetypeKey ? getArchetypeMove(archetypeKey, wcgsStage) : undefined,
  }
}

/** All unique nation keys in the library. */
export const NATION_KEYS = [...new Set(NATION_MOVES.map(m => m.source_key))] as const

/** All unique archetype keys in the library. */
export const ARCHETYPE_KEYS = [...new Set(ARCHETYPE_MOVES.map(m => m.source_key))] as const

/** Map WCGS stage to nursery type slug. */
export function wcgsToNurseryType(stage: WcgsStage): string {
  const map: Record<WcgsStage, string> = {
    wake_up: 'wake-up',
    clean_up: 'clean-up',
    grow_up: 'grow-up',
    show_up: 'show-up',
  }
  return map[stage]
}

/** Map nursery type slug to WCGS stage. */
export function nurseryTypeToWcgs(nurseryType: string): WcgsStage | undefined {
  const map: Record<string, WcgsStage> = {
    'wake-up': 'wake_up',
    'clean-up': 'clean_up',
    'grow-up': 'grow_up',
    'show-up': 'show_up',
  }
  return map[nurseryType]
}
