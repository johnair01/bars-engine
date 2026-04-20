/**
 * BAR Asset Pipeline — type contracts
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Phase 2 — Translation Layer
 *
 * Defines the shared protocol between:
 *   Constructor A: NL authoring (BarSeed → structured seed)
 *   Constructor B: Translation (BarSeed → BarAsset)
 *   Constructor C: Game renderer (BarAsset → DOM)
 *
 * Key principle: do NOT unify the three existing BAR systems.
 * Define a protocol that connects them at well-defined boundaries.
 *
 * References:
 *   src/lib/bars.ts — BarDef, BarInput, BarType (existing)
 *   src/lib/bar-seed-metabolization/types.ts — SeedMetabolizationState (existing)
 *   src/lib/bar-forge/types.ts — BarAnalysis (existing)
 */

import type { BarDef, BarInput } from '../bars'
import type { MaturityPhase, SeedMetabolizationState } from '../bar-seed-metabolization/types'

// ---------------------------------------------------------------------------
// Re-exports for consumers who only need the protocol
// ---------------------------------------------------------------------------

export { MATURITY_PHASES } from '../bar-seed-metabolization/types'
export type { MaturityPhase }

// ---------------------------------------------------------------------------
// BarAsset — output of Constructor B, input to Constructor C
// ---------------------------------------------------------------------------

/**
 * BarAsset is the lego-piece unit for game assembly.
 *
 * Constructor C (game renderer) only accepts BarAssets.
 * A BarAsset is a BarDef that has reached maturity = 'integrated'.
 *
 * It adds:
 *   - maturity: always 'integrated'
 *   - integratedAt: timestamp of translation
 *   - sourceSeedId: tracks provenance
 *   - metadata: translation context (provider, tokens, tags, face)
 */
export interface BarAsset {
  /** The underlying component definition — what Constructor C renders. */
  barDef: BarDef
  /** Always 'integrated' — the only maturity Constructor B produces. */
  maturity: 'integrated'
  /** ISO 8601 timestamp when this asset was assembled. */
  integratedAt: string
  /** The bar id of the source BarSeed that produced this asset. */
  sourceSeedId: string
  /** Translation layer metadata. */
  metadata?: {
    /** Who ran the translation (creator segment of the structured id). */
    author?: string
    /** Tags from the NL generation. */
    tags?: string[]
    /** Which GM face was triggered during generation. */
    gameMasterFace?: string
    /** Emotional vector from the seed analysis. */
    emotionalVector?: {
      channelFrom: string
      channelTo: string
      altitudeFrom: string
      altitudeTo: string
    }
    /** Which NL provider completed the translation. */
    translationProvider?: string
    /** Estimated token count consumed. */
    translationTokens?: number | null
  }
}

// ---------------------------------------------------------------------------
// The four BAR types (not one)
// ---------------------------------------------------------------------------

/**
 * BarSeed: raw authored content + metabolization state (bar-seed-metabolization)
 * BarAnalysis: quest-matching type + wavePhase + polarity (bar-forge)
 * BarDef: UI component definition (bars.ts)
 * BarAsset: BarDef at maturity='integrated' (this protocol)
 */

// ---------------------------------------------------------------------------
// Maturity helpers — for Constructor B gate
// ---------------------------------------------------------------------------

/** Rank map used to compare maturity phases. */
const MATURITY_RANK: Record<MaturityPhase, number> = {
  captured: 0,
  context_named: 1,
  elaborated: 2,
  shared_or_acted: 3,
  integrated: 4,
}

/**
 * True when a seed's maturity is >= 'shared_or_acted'.
 * Only seeds at or above this threshold can enter Constructor B.
 *
 * Constructor B promotes 'shared_or_acted' → 'integrated' on success.
 */
export function hasMinimumMaturityForConstructorB(state: SeedMetabolizationState): boolean {
  return (state.maturity ? (MATURITY_RANK[state.maturity] ?? 0) : 0) >= (MATURITY_RANK["shared_or_acted"] ?? 0)
}

/**
 * Promote a BarDef from 'shared_or_acted' to 'integrated'.
 * Called by Constructor B on successful translation.
 */
export function promoteToIntegrated(
  barDef: BarDef,
  sourceSeedId: string,
  metadata?: BarAsset['metadata'],
): BarAsset {
  return {
    barDef,
    maturity: 'integrated',
    integratedAt: new Date().toISOString(),
    sourceSeedId,
    metadata,
  }
}

// ---------------------------------------------------------------------------
// Structured BarId — namespace convention for multi-creator multi-pipeline
// ---------------------------------------------------------------------------

/**
 * All valid bar type prefixes for structured ids.
 * Each corresponds to a distinct authoring/generation pipeline.
 */
export const BAR_TYPE_PREFIXES = [
  'blessed',   // NL authoring — Wendell's blessed objects
  'rune',      // Rune factory pipeline
  'quest',     // Quest generation
  'allyship',  // Allyship framework
  'story',     // Story/narrative content
  'vibe',      // Vibe/emotional content
] as const

export type BarTypePrefix = typeof BAR_TYPE_PREFIXES[number]

/**
 * A parsed structured BarId.
 * Format: {barTypePrefix}_{creator}_{sequence}
 * Example: blessed_wendell_001
 */
export interface StructuredBarId {
  barType: BarTypePrefix
  creator: string
  sequence: number
  /** The full id string, e.g. 'blessed_wendell_001' */
  raw: string
}

/**
 * Parse a structured BarId.
 * Returns the parsed components if valid, null if legacy/unstructured id.
 */
export function parseStructuredBarId(id: string): StructuredBarId | null {
  const match = id.match(/^([a-z]+)_([a-z0-9_-]+)_([0-9]+)$/)
  if (!match) return null
  const [, barType, creator, seqStr] = match
  if (!(BAR_TYPE_PREFIXES as readonly string[]).includes(barType)) return null
  return {
    barType: barType as BarTypePrefix,
    creator,
    sequence: parseInt(seqStr, 10),
    raw: id,
  }
}
