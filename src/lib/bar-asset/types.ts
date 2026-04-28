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
import type { DualAltitude } from '../quest-grammar/types'

// ---------------------------------------------------------------------------
// Re-exports for consumers who only need the protocol
// ---------------------------------------------------------------------------

export { MATURITY_PHASES } from '../bar-seed-metabolization/types'
export type { MaturityPhase }
export type { SeedMetabolizationState } from '../bar-seed-metabolization/types'

// ---------------------------------------------------------------------------
// Resolution Register — Octalysis D7 + RPG Design Zine #A-1 correction
// RPG Design Zine names three registers for resolving fictional outcomes:
//   Fortune  — random real-world element (die roll, I Ching hexagram) shapes fiction
//   Drama    — fiction drives outcome, no real-world element involved
//   Karma   — past behavior/decisions tracked in real-world state (tokens, sheet)
// bars-engine has all three:
//   Fortune: I Ching casting (cast-iching.ts) + prompt deck (prompt-deck-play.ts)
//   Drama:   narrative-only resolution without mechanical intervention
//   Karma:   BSM maturity phases + altitude map tracking
// See: GM_GAP_ANALYSIS_RPG_ZINE_BAR_MATURITY.md (bars-engine/)
// ---------------------------------------------------------------------------

/**
 * The resolution register for a BAR — which real-world mechanism resolves
 * contested fictional outcomes when the system needs an answer.
 *
 * - `fortune`: A random real-world element (I Ching hexagram, coin flip, die roll)
 *              shapes the fictional outcome. The mechanism is agnostic to fictional context.
 * - `drama`:   The ongoing fiction drives the outcome. No real-world element intervenes.
 *              Resolution is negotiated through fiction-internal logic.
 * - `karma`:   Past behavior or decisions (tracked in real-world state: tokens, sheet ratings,
 *              altitude) shape the outcome. Real-world state contextualizes the fiction.
 * - `none`:    No contested outcome anticipated; resolution is deferred to social negotiation.
 */
export type ResolutionRegister = 'fortune' | 'drama' | 'karma' | 'none'

/**
 * All resolution registers this system supports.
 * Use to validate or iterate over register types.
 */
export const RESOLUTION_REGISTERS: ResolutionRegister[] = [
  'fortune',
  'drama',
  'karma',
  'none',
]

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
  // DAOE Phase 1 FR1.3: Resolution Register on BarAsset
  // The register is inherited from the BarDef that produced this asset.
  // Constructor B (translation) copies it from BarDef at translation time.
  // Naming the register on BarAsset enables game-routing by register type.
  resolutionRegister?: ResolutionRegister
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
  // Altitude Mechanic FR1.2: Authored altitude zone
  // The dual altitude (emotional + developmental) this BAR is calibrated for.
  // When set, Constructor C (game renderer) uses it for altitude gating.
  // When absent, BAR is accessible at all altitudes (permissive default).
  // This is NOT the player's altitude — it is the BAR's target altitude.
  // See: .specify/specs/altitude-mechanic/spec.md
  authoredAltitudeZone?: import('../quest-grammar/types').DualAltitude | null
  // FR1.2: Whether this BAR is altitude-gated (locked until player reaches altitude)
  // When true and authoredAltitudeZone is set, Constructor C enforces altitude gates.
  // When false or absent, BAR is accessible regardless of player altitude.
  altitudeGated?: boolean
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