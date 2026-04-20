/**
 * BAR Asset Pipeline — type contracts
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Defines the shared protocol between Constructor A (NL authoring),
 * Constructor B (translation / asset assembly), and Constructor C (game renderer).
 *
 * Key principle: do NOT unify the three existing BAR systems.
 * Define a protocol that connects them at well-defined boundaries.
 */

import type { BarDef } from '../bars'
import type {
  MaturityPhase,
  SeedMetabolizationState,
} from '../bar-seed-metabolization/types'
import type { BarAnalysis } from '../bar-forge/types'

// ---------------------------------------------------------------------------
// Re-export maturity types for consumers who only need the protocol
// ---------------------------------------------------------------------------
export { MATURITY_PHASES } from '../bar-seed-metabolization/types'
export type { MaturityPhase }

/** The minimum maturity required for Constructor B to accept a BAR. */
export const BAR_ASSET_MIN_MATURITY: MaturityPhase = 'integrated'

// ---------------------------------------------------------------------------
// BarAsset — the protocol output of Constructor B
// ---------------------------------------------------------------------------

/**
 * BarAsset is the lego-piece unit for game assembly.
 *
 * Constructor C (game renderer) ONLY accepts BarAssets.
 * A BarAsset is a BarDef that has reached maturity = 'integrated'.
 */
export interface BarAsset {
  /** The underlying component definition. */
  barDef: BarDef
  /** Always 'integrated' — the only maturity Constructor B produces. */
  maturity: 'integrated'
  /** ISO 8601 timestamp when this asset was assembled. */
  integratedAt: string
  /** The structured id of the source BarSeed that produced this asset. */
  sourceSeedId: string
  /** Optional metadata from the translation layer. */
  metadata?: {
    author?: string
    tags?: string[]
    gameMasterFace?: string
    emotionalVector?: {
      channelFrom: string
      channelTo: string
      altitudeFrom: string
      altitudeTo: string
    }
  }
}

// ---------------------------------------------------------------------------
// Constructor A output — what the NL authoring engine produces
// ---------------------------------------------------------------------------

/**
 * Output of Constructor A (NL authoring engine).
 *
 * The NL engine is the only component that knows both BarSeed internals
 * and BarDef requirements. It outputs a BarSeed with sufficient maturity
 * for Constructor B to attempt translation.
 */
export interface ConstructorAOutput {
  /**
   * The authored BAR seed with metabolization state.
   * Must have maturity >= 'shared_or_acted' to pass the Constructor B gate.
   */
  seed: {
    barDef: BarDef
    metabolization: SeedMetabolizationState
  }
  /** Optional analysis for quest matching. */
  analysis?: BarAnalysis
  /** The structured id following the BAR id convention. */
  id: string
  /** The bar type prefix used in the structured id. */
  barType: string
  /** The author's identity, used as the creator segment of the structured id. */
  creator: string
}

// ---------------------------------------------------------------------------
// Constructor B input — what the translation layer accepts
// ---------------------------------------------------------------------------

/**
 * Input to Constructor B (translation / asset assembly layer).
 *
 * Constructor B validates maturity before accepting a seed for translation.
 * Rejects seeds with maturity < 'shared_or_acted'.
 */
export interface ConstructorBInput {
  seed: ConstructorAOutput['seed']
  analysis?: BarAnalysis
  /** The structured bar id of the source seed. */
  sourceId: string
}

/**
 * Result of a Constructor B translation attempt.
 */
export interface ConstructorBResult {
  /** The assembled BarAsset, present only on success. */
  asset?: BarAsset
  /** True if the seed was rejected due to insufficient maturity. */
  rejected: boolean
  /** Reason code when rejected. */
  rejectionReason?: 'maturity_insufficient' | 'invalid_bar_def' | 'translation_failed'
  /** Human-readable message for debugging / logging. */
  message?: string
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a SeedMetabolizationState has sufficient maturity
 * for Constructor B to accept it.
 *
 * Minimum accepted: 'shared_or_acted'
 * Constructor B promotes 'shared_or_acted' -> 'integrated' on success.
 */
export function hasMinimumMaturityForConstructorB(
  state: SeedMetabolizationState,
): boolean {
  const MATURITY_RANK: Record<MaturityPhase, number> = {
    captured: 0,
    context_named: 1,
    elaborated: 2,
    shared_or_acted: 3,
    integrated: 4,
  }
  const current = state.maturity ?? 'captured'
  return (MATURITY_RANK[current] ?? 0) >= MATURITY_RANK['shared_or_acted']
}

/**
 * Promote a seed from 'shared_or_acted' to 'integrated'.
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
