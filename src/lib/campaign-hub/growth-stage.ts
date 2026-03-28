/**
 * Growth Stage Utility — Campaign Hub / Spoke Seed Architecture
 *
 * Maps a seed's water level (0–100) to one of four named growth stages:
 *   sprout → sapling → plant → tree
 *
 * Thresholds are hardcoded per GM face (sect). Each sect encodes a different
 * cultivation tempo derived from its Spiral Dynamics character:
 *
 *   Shaman     (Purple/Magenta, ritual/slow sacred growth)  — high thresholds
 *   Challenger (Red,  aggressive/fast progression)          — low thresholds
 *   Regent     (Amber, orderly equal stages)                — linear 25/50/75
 *   Architect  (Orange, strategic: easy early, hard mastery)— front-loaded
 *   Diplomat   (Green, nurturing, long mid-journey)         — gradual
 *   Sage       (Yellow/Teal, integrated: balanced + climax) — balanced
 *
 * No admin tuning panel in v1 — these weights are the canonical sect contracts.
 *
 * Color tokens use ElementKey from card-tokens.ts (Wuxing semantics):
 *   sprout  → water  (水 brings seeds to life)
 *   sapling → wood   (木 = vitality, growth)
 *   plant   → earth  (土 = rooted, stable)
 *   tree    → fire   (火 = full expression, bearing fruit)
 *
 * Icon keys are resolved by the UI layer from public/icons/growth/.
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { ElementKey } from '@/lib/ui/card-tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GrowthStageName = 'sprout' | 'sapling' | 'plant' | 'tree'

export interface GrowthStageMetadata {
  /** Canonical stage identifier */
  name: GrowthStageName
  /** Human-readable label for display in UI */
  label: string
  /** Icon key — resolved to public/icons/growth/{iconKey}.svg by the UI layer */
  iconKey: string
  /** Wuxing element color token — use with ELEMENT_TOKENS from card-tokens.ts */
  colorToken: ElementKey
  /** Minimum water level (inclusive) for this stage under the active face thresholds */
  minWater: number
  /** Maximum water level (inclusive) for this stage under the active face thresholds */
  maxWater: number
}

/**
 * Per-face thresholds: the water level at which a stage BEGINS.
 * Sprout always starts at 0.
 */
export interface FaceGrowthThresholds {
  /** Water level at which sprout advances to sapling (≥ this value) */
  sapling: number
  /** Water level at which sapling advances to plant (≥ this value) */
  plant: number
  /** Water level at which plant advances to tree (≥ this value) */
  tree: number
}

// ─── Hardcoded Face Thresholds (v1) ──────────────────────────────────────────

/**
 * GM_FACE_GROWTH_THRESHOLDS — hardcoded per sect for v1.
 *
 * Each face determines how much watering is required to progress through stages.
 * Thresholds are purposeful, not arbitrary — they encode the sect's developmental
 * character (Spiral Dynamics level) as a cultivation tempo.
 *
 * Design notes:
 *   - Shaman: ritual initiation is slow — requires 30/65/90; seeds must steep.
 *   - Challenger: prove it fast — 15/35/60; aggressive tempo.
 *   - Regent: equal linear stages — 25/50/75; rule-governed symmetry.
 *   - Architect: strategic front-load (quick sprout→sapling) but mastery demands more — 20/45/80.
 *   - Diplomat: nurturing and gradual; long middle journey — 20/50/85.
 *   - Sage: balanced integration with accelerated final flourishing — 25/55/80.
 */
export const GM_FACE_GROWTH_THRESHOLDS: Record<GameMasterFace, FaceGrowthThresholds> = {
  shaman:     { sapling: 30, plant: 65, tree: 90 },
  challenger: { sapling: 15, plant: 35, tree: 60 },
  regent:     { sapling: 25, plant: 50, tree: 75 },
  architect:  { sapling: 20, plant: 45, tree: 80 },
  diplomat:   { sapling: 20, plant: 50, tree: 85 },
  sage:       { sapling: 25, plant: 55, tree: 80 },
} as const

// ─── Stage Base Metadata ─────────────────────────────────────────────────────

/**
 * GROWTH_STAGE_BASE — static metadata per stage (label, icon, color).
 * minWater / maxWater are face-dependent and computed by getGrowthStage.
 */
export const GROWTH_STAGE_BASE: Record<
  GrowthStageName,
  Pick<GrowthStageMetadata, 'name' | 'label' | 'iconKey' | 'colorToken'>
> = {
  sprout: {
    name:       'sprout',
    label:      'Sprout',
    iconKey:    'growth-sprout',
    colorToken: 'water',   // 水 — water brings seeds to life
  },
  sapling: {
    name:       'sapling',
    label:      'Sapling',
    iconKey:    'growth-sapling',
    colorToken: 'wood',    // 木 — vitality, upward growth
  },
  plant: {
    name:       'plant',
    label:      'Plant',
    iconKey:    'growth-plant',
    colorToken: 'earth',   // 土 — rooted, stable, established
  },
  tree: {
    name:       'tree',
    label:      'Tree',
    iconKey:    'growth-tree',
    colorToken: 'fire',    // 火 — full expression, bearing fruit, ready to generate quests
  },
} as const

// ─── Core Utility ─────────────────────────────────────────────────────────────

/**
 * Resolve the growth stage for a seed given a water level and the active GM face.
 *
 * @param waterLevel - Current water level 0–100 (clamped automatically).
 * @param face - The active GM face; determines which threshold table is used.
 * @returns Full {@link GrowthStageMetadata} including the stage name, display
 *   metadata, and the min/max water bounds for the resolved stage under this face.
 *
 * @example
 * const stage = getGrowthStage(42, 'regent')
 * // → { name: 'sapling', label: 'Sapling', iconKey: 'growth-sapling',
 * //     colorToken: 'wood', minWater: 25, maxWater: 49 }
 */
export function getGrowthStage(waterLevel: number, face: GameMasterFace): GrowthStageMetadata {
  const clamped = Math.max(0, Math.min(100, Math.round(waterLevel)))
  const t = GM_FACE_GROWTH_THRESHOLDS[face]

  let name: GrowthStageName
  let minWater: number
  let maxWater: number

  if (clamped >= t.tree) {
    name = 'tree'
    minWater = t.tree
    maxWater = 100
  } else if (clamped >= t.plant) {
    name = 'plant'
    minWater = t.plant
    maxWater = t.tree - 1
  } else if (clamped >= t.sapling) {
    name = 'sapling'
    minWater = t.sapling
    maxWater = t.plant - 1
  } else {
    name = 'sprout'
    minWater = 0
    maxWater = t.sapling - 1
  }

  return {
    ...GROWTH_STAGE_BASE[name],
    minWater,
    maxWater,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Return all four stage metadata entries for a given face, ordered sprout → tree.
 * Useful for rendering a progress indicator or stage legend.
 *
 * @example
 * const stages = getGrowthStagesForFace('regent')
 * // [
 * //   { name: 'sprout',  minWater: 0,  maxWater: 24, ... },
 * //   { name: 'sapling', minWater: 25, maxWater: 49, ... },
 * //   { name: 'plant',   minWater: 50, maxWater: 74, ... },
 * //   { name: 'tree',    minWater: 75, maxWater: 100, ... },
 * // ]
 */
export function getGrowthStagesForFace(face: GameMasterFace): GrowthStageMetadata[] {
  const t = GM_FACE_GROWTH_THRESHOLDS[face]
  return [
    { ...GROWTH_STAGE_BASE.sprout,  minWater: 0,        maxWater: t.sapling - 1 },
    { ...GROWTH_STAGE_BASE.sapling, minWater: t.sapling, maxWater: t.plant - 1 },
    { ...GROWTH_STAGE_BASE.plant,   minWater: t.plant,   maxWater: t.tree - 1 },
    { ...GROWTH_STAGE_BASE.tree,    minWater: t.tree,    maxWater: 100 },
  ]
}

/**
 * Calculate a fractional progress value (0.0–1.0) within the current stage.
 * Useful for animating a progress bar within a stage.
 *
 * @example
 * getGrowthProgress(37, 'regent')
 * // → 0.48  (37 is 48% through the sapling stage: 25..49)
 */
export function getGrowthProgress(waterLevel: number, face: GameMasterFace): number {
  const stage = getGrowthStage(waterLevel, face)
  const clamped = Math.max(0, Math.min(100, Math.round(waterLevel)))
  const range = stage.maxWater - stage.minWater
  if (range === 0) return 1
  return Math.min(1, (clamped - stage.minWater) / range)
}

/**
 * Return the water level needed to reach a specific stage under a given face.
 * Returns 0 for 'sprout' (always available at any water level).
 */
export function waterLevelForStage(stage: GrowthStageName, face: GameMasterFace): number {
  const t = GM_FACE_GROWTH_THRESHOLDS[face]
  switch (stage) {
    case 'sprout':  return 0
    case 'sapling': return t.sapling
    case 'plant':   return t.plant
    case 'tree':    return t.tree
  }
}
