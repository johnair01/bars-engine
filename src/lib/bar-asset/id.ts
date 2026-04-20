/**
 * BarAsset ID — structured namespace for multi-creator multi-pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
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
 *
 * References:
 *   src/lib/bar-asset/types.ts — StructuredBarId type + BAR_TYPE_PREFIXES
 */

import { BAR_TYPE_PREFIXES, type BarTypePrefix } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Valid bar types for structured id construction. */
export type BarType = BarTypePrefix

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

/**
 * Build a structured BarId from components.
 * Ensures: creator is safe (lowercase, no special chars), sequence is zero-padded.
 *
 * @example
 * buildStructuredBarId('blessed', 'wendell', 1) // → 'blessed_wendell_001'
 */
export function buildStructuredBarId(
  barType: BarType,
  creator: string,
  sequence: number,
): string {
  const safeCreator = creator.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 64)
  const safeSeq = String(sequence).padStart(3, '0').slice(0, 6)
  return `${barType}_${safeCreator}_${safeSeq}`
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Validate a BarId against the structured namespace convention.
 * Returns the parsed StructuredBarId for structured ids,
 * returns null for legacy ids (e.g. 'bar_blessed_object', 'bar_01').
 *
 * @param id - The BarId to parse
 * @returns StructuredBarId if valid structured format, null otherwise
 */
export function parseStructuredBarId(id: string): { barType: BarType; creator: string; sequence: number } | null {
  const match = id.match(/^([a-z]+)_([a-z0-9_-]+)_([0-9]{3,6})$/)
  if (!match) return null
  const [, barType, creator, seqStr] = match
  if (!(BAR_TYPE_PREFIXES as readonly string[]).includes(barType)) return null
  return {
    barType: barType as BarType,
    creator,
    sequence: parseInt(seqStr, 10),
  }
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize any BarId to structured format.
 * - Structured ids: returned as-is with isLegacy=false
 * - Legacy/unstructured ids: returned as-is with isLegacy=true
 * - Empty/whitespace: returns null
 */
export function normalizeBarId(id: string): { normalized: string; isLegacy: boolean } | null {
  const trimmed = id.trim()
  if (!trimmed) return null
  const parsed = parseStructuredBarId(trimmed)
  if (parsed) return { normalized: trimmed, isLegacy: false }
  return { normalized: trimmed, isLegacy: true }
}
