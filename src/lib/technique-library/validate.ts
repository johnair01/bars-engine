/**
 * Technique validation — enum membership + the metabolization provenance gate.
 * Spec: .specify/specs/allyship-technique-vocabulary/spec.md § FR4
 *
 * Deterministic. The provenance gate is the DIPLOMAT consent/power-dynamic check
 * applied to knowledge: importing an outside practice requires lineage,
 * permission, and an ontological-footing note ("composting, not necromancy").
 */

import type { Technique, TechniqueAspect, TechniqueOrigin, TechniqueTier } from './types'
import {
  MOVE_VALUES,
  OPERATION_VALUES,
  DOMAIN_VALUES,
  CHANNEL_VALUES,
  CAPABILITY_VALUES,
  SUPERPOWERS,
} from './vocabulary'

export type ValidationResult = { ok: true } | { ok: false; errors: string[] }

const ASPECT_VALUES: TechniqueAspect[] = ['inner', 'outer', 'both']
const TIER_VALUES: TechniqueTier[] = ['canonical', 'community', 'personal']
const STATUS_VALUES: Technique['status'][] = ['draft', 'candidate', 'published']
const ORIGIN_VALUES: TechniqueOrigin[] = ['book', 'tradition', 'personal_dev', 'player', 'gm', 'ai']

/** Origins that import outside knowledge — subject to the strict provenance gate. */
const IMPORT_ORIGINS: TechniqueOrigin[] = ['tradition', 'personal_dev']

function checkSubset<T>(
  field: string,
  values: readonly T[] | undefined,
  allowed: readonly T[],
  errors: string[],
): void {
  if (!values) return
  for (const v of values) {
    if (!allowed.includes(v)) errors.push(`${field}: invalid value "${String(v)}"`)
  }
}

export function validateTechnique(t: Technique): ValidationResult {
  const errors: string[] = []

  // ── required minimal fields (personal/player techniques need at least these) ──
  if (!t.id) errors.push('id: required')
  if (!t.slug) errors.push('slug: required')
  if (!t.name) errors.push('name: required')
  if (!t.essence) errors.push('essence: required')
  if (!t.steps || t.steps.length === 0) errors.push('steps: at least one step required')
  if (!t.moves || t.moves.length === 0) errors.push('moves: at least one move required')

  // ── enum membership for every tag axis ──
  checkSubset('moves', t.moves, MOVE_VALUES, errors)
  checkSubset('operations', t.operations, OPERATION_VALUES, errors)
  checkSubset('domains', t.domains, DOMAIN_VALUES, errors)
  checkSubset('channels', t.channels, CHANNEL_VALUES, errors)
  checkSubset('capabilities', t.capabilities, CAPABILITY_VALUES, errors)
  checkSubset('superpowers', t.superpowers, SUPERPOWERS, errors)
  if (!ASPECT_VALUES.includes(t.aspect)) errors.push(`aspect: invalid value "${t.aspect}"`)
  if (!TIER_VALUES.includes(t.tier)) errors.push(`tier: invalid value "${t.tier}"`)
  if (!STATUS_VALUES.includes(t.status)) errors.push(`status: invalid value "${t.status}"`)

  // ── source / provenance ──
  if (!t.source || !t.source.origin) {
    errors.push('source.origin: required')
  } else {
    if (!ORIGIN_VALUES.includes(t.source.origin)) {
      errors.push(`source.origin: invalid value "${t.source.origin}"`)
    }
    // Provenance gate: outside imports must honor lineage + consent + footing.
    if (IMPORT_ORIGINS.includes(t.source.origin)) {
      if (!t.source.lineage) errors.push('source.lineage: required for imported techniques')
      if (!t.source.permission) errors.push('source.permission: required for imported techniques')
      if (!t.ontologicalFooting) {
        errors.push('ontologicalFooting: required for imported techniques')
      }
    }
    // Book-sourced techniques must at least name the book.
    if (t.source.origin === 'book' && !t.source.name) {
      errors.push('source.name: required for book-sourced techniques')
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
