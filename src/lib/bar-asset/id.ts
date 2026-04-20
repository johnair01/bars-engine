// BarAsset ID — structured namespace convention
// Sprint: sprint/bar-asset-pipeline-001 | Issue: #76

import type { BarDef } from '../bars'
import type { SeedMetabolizationState, MaturityPhase } from '../bar-seed-metabolization/types'

/**
 * Valid BAR type prefixes for the structured namespace.
 * Convention: {barType}_{creator}_{sequence}
 */
export const BAR_TYPES = [
  'blessed',
  'rune',
  'quest',
  'allyship',
  'vibe',
  'story',
  'insight',
] as const
export type BarType = (typeof BAR_TYPES)[number]

/**
 * Structured BAR ID following the namespace convention.
 * Format: {barType}_{creator}_{sequence}
 *
 * Examples:
 *   blessed_wendell_001
 *   rune_zoc_001
 *   quest_barsengine_001
 *   allyship_masteringallyship_001
 */
export type StructuredBarId = string

function isValidBarType(v: unknown): v is BarType {
  return typeof v === 'string' && (BAR_TYPES as readonly string[]).includes(v)
}

function isValidCreator(v: unknown): v is string {
  return typeof v === 'string' && /^[a-z0-9_-]{1,64}$/.test(v)
}

function isValidSequence(v: unknown): v is string {
  return typeof v === 'string' && /^\d{3,6}$/.test(v)
}

/**
 * Parse a structured BarId into its components.
 * Returns null if the id does not conform to the namespace convention.
 */
export function parseStructuredBarId(
  id: string,
): { barType: BarType; creator: string; sequence: string } | null {
  const parts = id.split('_')
  if (parts.length !== 3) return null
  const [barType, creator, sequence] = parts
  if (!isValidBarType(barType)) return null
  if (!isValidCreator(creator)) return null
  if (!isValidSequence(sequence)) return null
  return { barType, creator, sequence }
}

/**
 * Build a structured BarId from components.
 */
export function buildStructuredBarId(
  barType: BarType,
  creator: string,
  sequence: number,
): StructuredBarId {
  const safeCreator = creator.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 64)
  const safeSeq = String(sequence).padStart(3, '0').slice(0, 6)
  return `${barType}_${safeCreator}_${safeSeq}`
}

/**
 * Validate a BarId against the structured namespace convention.
 * Returns null for valid structured ids; returns the raw id for legacy ids.
 */
export function normalizeBarId(
  id: string,
): { normalized: StructuredBarId; isLegacy: boolean } | null {
  const parsed = parseStructuredBarId(id)
  if (parsed) {
    return { normalized: id, isLegacy: false }
  }
  // Legacy id — passthrough with flag
  if (typeof id === 'string' && id.length > 0) {
    return { normalized: id, isLegacy: true }
  }
  return null
}
