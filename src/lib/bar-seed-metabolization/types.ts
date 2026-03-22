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
}

export function isSoilKind(v: unknown): v is SoilKind {
  return typeof v === 'string' && (SOIL_KINDS as readonly string[]).includes(v)
}

export function isMaturityPhase(v: unknown): v is MaturityPhase {
  return typeof v === 'string' && (MATURITY_PHASES as readonly string[]).includes(v)
}
