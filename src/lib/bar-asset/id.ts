/**
 * BarAsset ID — structured namespace for multi-creator multi-pipeline
 * Sprint: sprint/bar-asset-pipeline-002 | Issue: #76
 *
 * All BarIds follow the structured namespace: {barType}_{creator}_{sequence}
 *
 * Examples:
 *   blessed_wendell_001     — Wendell's first blessed object
 *   rune_zoc_001           — Zo Computer's first rune
 *   quest_barsengine_001   — bars-engine's first quest
 *   allyship_masteringallyship_001 — MA.com allyship
 *
 * This convention makes ids self-describing and collision-free
 * when multiple constructors generate BARs independently.
 */

import { BAR_TYPE_PREFIXES, type BarTypePrefix } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Valid bar types for structured id construction. */
export type BarType = BarTypePrefix

/** A parsed structured BarId. */
export interface ParsedBarId {
  barType: BarType
  creator: string
  sequence: number
}

/** Error when a bar id string doesn't match expected format. */
export class BarIdParseError extends Error {
  constructor(readonly id: string) {
    super(`BarId '${id}' does not match format {barType}_{creator}_{sequence}`)
    this.name = 'BarIdParseError'
  }
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

/**
 * Build a structured BarId from components.
 *
 * @param barType  - e.g. 'blessed', 'rune', 'quest'
 * @param creator  - e.g. 'barsengine', 'wendell', 'zoc'
 * @param sequence - integer sequence number (1-indexed)
 */
export function buildStructuredBarId(
  barType: BarTypePrefix | string,
  creator: string,
  sequence: number,
): string {
  const normalized = BAR_TYPE_PREFIXES.includes(barType as BarTypePrefix)
    ? barType
    : 'story'
  return `${normalized}_${creator}_${String(sequence).padStart(3, '0')}`
}

/**
 * Parse a structured BarId back into its components.
 *
 * @throws BarIdParseError if format doesn't match
 */
export function parseStructuredBarId(id: string): ParsedBarId {
  const parts = id.split('_')
  if (parts.length !== 3) {
    throw new BarIdParseError(id)
  }
  const [barType, creator, seqStr] = parts
  if (!BAR_TYPE_PREFIXES.includes(barType as BarTypePrefix)) {
    throw new BarIdParseError(id)
  }
  const sequence = parseInt(seqStr, 10)
  if (isNaN(sequence) || sequence <= 0) {
    throw new BarIdParseError(id)
  }
  return { barType: barType as BarType, creator, sequence }
}