/**
 * BAR Seed Metabolization (BSM) — persisted on CustomBar.seedMetabolization (JSON string).
 * @see .specify/specs/bar-seed-metabolization/spec.md
 */

export const SOIL_KINDS = ['campaign', 'thread', 'holding_pen'] as const
export type SoilKind = (typeof SOIL_KINDS)[number]

/** Aligns with WCGS-style phases from the BSM spec. */
export const MATURITY_PHASES = [
  'captured',
  'context_named',
  'elaborated',
  'shared_or_acted',
  'integrated',
] as const
export type MaturityPhase = (typeof MATURITY_PHASES)[number]

export type SeedMetabolizationState = {
  soilKind?: SoilKind | null
  contextNote?: string | null
  maturity?: MaturityPhase | null
  /** ISO 8601 — set when composted (mirrors soft-archive moment). */
  compostedAt?: string | null
  /** Optional witness line when composting. */
  releaseNote?: string | null
  /** The BARs garden (Six-faces-council bars-garden slice 1, bg2-one-plant-record): one plant per BAR, in either bed.
   *  Its rules are public/between/seedbed.js. */
  plant?: SeedPlant | null
}

export const PLANT_BEDS = ['hollow', 'chamber'] as const
export const PLANT_ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
export type SeedPlant = {
  bed: (typeof PLANT_BEDS)[number]
  element: (typeof PLANT_ELEMENTS)[number]
  /** The one line from the heart act, at most 140 characters, the player's words untouched. */
  intent?: string
  /** Stored for the stage rule, never drawn. */
  tends: number
  plantedAt: string
  tendedAt?: string
}

export function isSeedPlant(v: unknown): v is SeedPlant {
  if (!v || typeof v !== 'object') return false
  const p = v as Record<string, unknown>
  const okDate = (s: unknown) => typeof s === 'string' && Number.isFinite(Date.parse(s))
  return (
    (PLANT_BEDS as readonly unknown[]).includes(p.bed) &&
    (PLANT_ELEMENTS as readonly unknown[]).includes(p.element) &&
    Number.isInteger(p.tends) && (p.tends as number) >= 0 &&
    okDate(p.plantedAt) &&
    (p.tendedAt === undefined || okDate(p.tendedAt)) &&
    (p.intent === undefined || (typeof p.intent === 'string' && p.intent.length <= 140))
  )
}

export function isSoilKind(v: unknown): v is SoilKind {
  return typeof v === 'string' && (SOIL_KINDS as readonly string[]).includes(v)
}

export function isMaturityPhase(v: unknown): v is MaturityPhase {
  return typeof v === 'string' && (MATURITY_PHASES as readonly string[]).includes(v)
}
