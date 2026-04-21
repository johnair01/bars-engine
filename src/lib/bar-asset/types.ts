/**
 * BAR Asset Pipeline — type contracts
 * Sprint: sprint/bar-asset-pipeline-002 | Issue: #76
 *
 * Phase 1 — Types and ID Convention
 *
 * Defines the shared protocol between:
 *   Constructor A: NL authoring (BarSeed -> structured seed)
 *   Constructor B: Translation (BarSeed -> BarAsset)
 *   Constructor C: Game renderer (BarAsset -> DOM)
 *
 * Key principle: do NOT unify the three existing BAR systems.
 * Define a protocol that connects them at well-defined boundaries.
 *
 * References:
 *   src/lib/bars.ts — BarDef, BarInput, BarType (existing)
 *   src/lib/bar-seed-metabolization/types.ts — SeedMetabolizationState, MaturityPhase (existing)
 */

import type { BarDef, BarInput } from '../bars'
import type { MaturityPhase, SeedMetabolizationState } from '../bar-seed-metabolization/types'

// ---------------------------------------------------------------------------
// Re-exports for consumers who only need the protocol
// ---------------------------------------------------------------------------

export { MATURITY_PHASES } from '../bar-seed-metabolization/types'
export type { MaturityPhase }
export type { SeedMetabolizationState } from '../bar-seed-metabolization/types'

// ---------------------------------------------------------------------------
// Bar Type Prefixes
// ---------------------------------------------------------------------------

/** Valid bar type prefixes for structured ID construction. */
export const BAR_TYPE_PREFIXES = [
  'blessed',   // Blessed object (dungeon room)
  'rune',      // Rune
  'quest',     // Quest
  'allyship',  // Allyship content
  'story',     // Story content
] as const

export type BarTypePrefix = (typeof BAR_TYPE_PREFIXES)[number]

// ---------------------------------------------------------------------------
// BarAsset — the core output of Constructor B
// ---------------------------------------------------------------------------

/**
 * BarAsset is the output of the translation layer (Constructor B).
 * It is the input to Constructor C (game renderer).
 *
 * The maturity is always 'integrated' — Constructor B is the gate that
 * promotes content from the NL authoring pipeline into the game pipeline.
 */
export interface BarAsset {
  /** Structured ID: {barType}_{creator}_{sequence} */
  id: string
  /** BarDef for the game renderer */
  barDef: BarDef
  /** Always 'integrated' — Constructor B gate */
  maturity: 'integrated'
  /** Source seed that produced this asset */
  sourceSeedId: string | null
  /** Metadata produced by Constructor B */
  metadata: BarAssetMetadata
}

/** Metadata attached to a BarAsset during translation. */
export interface BarAssetMetadata {
  /** Author segment of the structured ID */
  author?: string
  /** Creator who ran the translation */
  creator?: string
  /** AI provider used for NL generation */
  translationProvider?: string | null
  /** Token count from the NL generation call */
  translationTokens?: number | null
  /** Optional emotional vector for game routing */
  emotionalVector?: unknown
  /** Optional GM face for game routing */
  gameMasterFace?: string
  /** Optional tags (e.g., mood strings, story path hints) */
  tags?: string[]
  /** Arbitrary extra metadata from the NL output */
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Maturity Gate
// ---------------------------------------------------------------------------

/** Minimum maturity required to enter Constructor B (translation). */
export const MINIMUM_MATURITY = 'shared_or_acted' as const

/**
 * Check whether content has sufficient maturity for Constructor B.
 * Throws SeedMaturityError if maturity is below 'shared_or_acted'.
 */
export function hasMinimumMaturityForConstructorB(
  metabolization: SeedMetabolizationState | undefined | null,
): boolean {
  if (!metabolization?.maturity) return false
  const phases = ['captured', 'context_named', 'elaborated', 'shared_or_acted', 'integrated']
  const idx = phases.indexOf(metabolization.maturity as MaturityPhase)
  return idx >= phases.indexOf('shared_or_acted')
}

/**
 * Promote a BarDef to a BarAsset with maturity='integrated'.
 */
export function promoteToIntegrated(
  barDef: BarDef,
  sourceSeedId: string | null,
  metadata: BarAssetMetadata,
): BarAsset {
  return {
    id: barDef.id,
    barDef,
    maturity: 'integrated',
    sourceSeedId,
    metadata,
  }
}