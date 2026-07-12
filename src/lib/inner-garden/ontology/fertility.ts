/**
 * Inner Garden — Action Economy & Farm Fertility (Pressure 1).
 *
 * Spec: .specify/specs/inner-garden-action-economy-fertility/spec.md
 *
 * Couples intake (plant/capture) to throughput (harvest/compost): planting faster than you
 * tend crowds a field and drains fertility, so composting becomes the obvious regenerative
 * move. Governed by the Abundance ↔ Cultivation polarity (docs/VALUES_AND_POLARITIES.md) —
 * there is no "correct" fertility level, only rhythm; do NOT add a score or streak.
 *
 * Key invariants:
 *  - Compost restores ≥ harvest (letting go is rewarded, not shamed).
 *  - Low fertility gates fruit QUALITY (growthMultiplier), never ACCESS — you can always act.
 *
 * Pure functions, clamped, deterministic. No I/O, no render, no cron.
 */

export interface FieldFertility {
  capacity: number // healthy active-seed count for this field
  activeSeeds: number // planted, not yet harvested/composted
  fertility: number // 0..100
}

export type FertilityAction = 'plant' | 'harvest' | 'compost' | 'tick' // 'tick' = one day passes

// --- tuning (one place; easy to dogfood-tune) ---
export const PLANT_COST = 4
export const HARVEST_GAIN = 8
export const COMPOST_GAIN = 12 // ≥ HARVEST_GAIN by design
export const DECAY_BASE = 2 // fertility lost per idle day
export const DECAY_PER_CROWD = 10 // extra daily loss per unit of crowding over 1
const LOW_FERTILITY = 30 // below this, tending is suggested even when not overcrowded

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/** crowding ratio (>1 overcrowded). Guards capacity ≤ 0. */
export function crowding(f: FieldFertility): number {
  return f.capacity > 0 ? f.activeSeeds / f.capacity : Infinity
}

export function isOvercrowded(f: FieldFertility): boolean {
  return crowding(f) > 1
}

/** Growth/quality multiplier from fertility: 0.25 (barren) → 1.0 (full). Never 0 — access is never gated. */
export function growthMultiplier(fertility: number): number {
  return 0.25 + 0.75 * (clamp(fertility, 0, 100) / 100)
}

/** Apply an action; pure, clamped to fertility ∈ [0,100] and activeSeeds ≥ 0. */
export function applyFertilityAction(f: FieldFertility, action: FertilityAction): FieldFertility {
  switch (action) {
    case 'plant':
      return { ...f, activeSeeds: f.activeSeeds + 1, fertility: clamp(f.fertility - PLANT_COST, 0, 100) }
    case 'harvest':
      return {
        ...f,
        activeSeeds: Math.max(0, f.activeSeeds - 1),
        fertility: clamp(f.fertility + HARVEST_GAIN, 0, 100),
      }
    case 'compost':
      return {
        ...f,
        activeSeeds: Math.max(0, f.activeSeeds - 1),
        fertility: clamp(f.fertility + COMPOST_GAIN, 0, 100),
      }
    case 'tick': {
      const overCrowd = Math.max(0, crowding(f) - 1)
      const decay = DECAY_BASE + DECAY_PER_CROWD * overCrowd
      return { ...f, fertility: clamp(f.fertility - decay, 0, 100) }
    }
  }
}

/**
 * Suggest a regenerative tending move when overcrowded or barren. Null when healthy.
 * No streaks, no scores — a nudge toward composting, framed as feeding the soil.
 */
export function suggestTending(f: FieldFertility): { compostSuggested: number; reason: string } | null {
  const over = isOvercrowded(f)
  const barren = f.fertility < LOW_FERTILITY
  if (!over && !barren) return null
  const compostSuggested = over ? Math.max(1, f.activeSeeds - f.capacity) : 1
  const reason = over
    ? `This field is crowded (${f.activeSeeds}/${f.capacity}) and the soil is thinning — composting ${compostSuggested} feeds it back.`
    : 'The soil is thin — composting a seed you won’t act on restores it.'
  return { compostSuggested, reason }
}
