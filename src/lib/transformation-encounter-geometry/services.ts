/**
 * Transformation Encounter Geometry v0 — Selection and weighting services
 * Spec: .specify/specs/transformation-encounter-geometry/spec.md
 */

import {
  ENCOUNTER_TYPES,
  MOVE_GEOMETRY_ALIGNMENT,
  NATION_GEOMETRY_BIAS,
  ARCHETYPE_GEOMETRY_TENDENCY,
} from './encounter-types'
import type { EncounterCoordinate, EncounterType } from './types'

/** Get all encounter types. */
export function getAllEncounterTypes(): EncounterType[] {
  return [...ENCOUNTER_TYPES]
}

/** Get encounter type by coordinate. */
export function getEncounterByCoordinate(coordinate: EncounterCoordinate): EncounterType | undefined {
  return ENCOUNTER_TYPES.find(
    (e) =>
      e.coordinate.hide_seek === coordinate.hide_seek &&
      e.coordinate.truth_dare === coordinate.truth_dare &&
      e.coordinate.interior_exterior === coordinate.interior_exterior
  )
}

/** Get encounter type by ID. */
export function getEncounterById(encounterId: string): EncounterType | undefined {
  return ENCOUNTER_TYPES.find((e) => e.encounter_id === encounterId)
}

/** Get encounter types that include a given move in typical_moves. */
export function getEncountersForMove(moveId: string): EncounterType[] {
  const normalized = moveId.toLowerCase()
  return ENCOUNTER_TYPES.filter((e) => e.typical_moves.includes(normalized))
}

/** Get geometry alignment for a move. */
export function getMoveGeometryAlignment(moveId: string): EncounterCoordinate | undefined {
  const normalized = moveId.toLowerCase()
  return MOVE_GEOMETRY_ALIGNMENT[normalized]
}

/** Get nation geometry bias (normalized by nation name). */
export function getNationGeometryBias(nationIdOrName: string): Partial<EncounterCoordinate> {
  const key = nationIdOrName.toLowerCase().replace(/\s+/g, '-')
  return NATION_GEOMETRY_BIAS[key] ?? {}
}

/** Get archetype geometry tendency (normalized by archetype slug). */
export function getArchetypeGeometryTendency(archetypeIdOrSlug: string): Partial<EncounterCoordinate> {
  const key = archetypeIdOrSlug.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-')
  return ARCHETYPE_GEOMETRY_TENDENCY[key] ?? {}
}

/** Compute match score between coordinate and nation/archetype biases (0–3). */
export function computeGeometryMatchScore(
  coordinate: EncounterCoordinate,
  nationId?: string,
  archetypeId?: string
): number {
  let score = 0
  if (nationId) {
    const bias = getNationGeometryBias(nationId)
    if (bias.hide_seek === coordinate.hide_seek) score += 1
    if (bias.truth_dare === coordinate.truth_dare) score += 1
    if (bias.interior_exterior === coordinate.interior_exterior) score += 1
  }
  if (archetypeId) {
    const tendency = getArchetypeGeometryTendency(archetypeId)
    if (tendency.hide_seek === coordinate.hide_seek) score += 1
    if (tendency.truth_dare === coordinate.truth_dare) score += 1
    if (tendency.interior_exterior === coordinate.interior_exterior) score += 1
  }
  return score
}

/** Get encounter types sorted by match score for given nation/archetype. */
export function getEncountersByNationArchetypeMatch(
  nationId?: string,
  archetypeId?: string
): EncounterType[] {
  return [...ENCOUNTER_TYPES].sort((a, b) => {
    const scoreA = computeGeometryMatchScore(a.coordinate, nationId, archetypeId)
    const scoreB = computeGeometryMatchScore(b.coordinate, nationId, archetypeId)
    return scoreB - scoreA
  })
}

/** Interpret coordinate as human-readable description. */
export function interpretCoordinate(coordinate: EncounterCoordinate): string {
  const parts: string[] = []
  parts.push(coordinate.hide_seek === 'seek' ? 'exploratory' : 'protective')
  parts.push(coordinate.truth_dare === 'dare' ? 'action challenge' : 'insight')
  parts.push(coordinate.interior_exterior === 'exterior' ? 'in the external world' : 'internally')
  return parts.join(' ')
}
