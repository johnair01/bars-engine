/**
 * Transformation Encounter Geometry v0 — Type definitions
 * Spec: .specify/specs/transformation-encounter-geometry/spec.md
 */

export type HideSeek = 'hide' | 'seek'
export type TruthDare = 'truth' | 'dare'
export type InteriorExterior = 'interior' | 'exterior'

export interface EncounterCoordinate {
  hide_seek: HideSeek
  truth_dare: TruthDare
  interior_exterior: InteriorExterior
}

export type EncounterTypeId =
  | 'hidden_truth'
  | 'hidden_challenge'
  | 'revealed_insight'
  | 'inner_breakthrough'
  | 'protected_truth'
  | 'quiet_action'
  | 'revealed_truth'
  | 'courageous_action'

export interface EncounterType {
  encounter_id: EncounterTypeId
  name: string
  coordinate: EncounterCoordinate
  interaction_type: string
  typical_moves: string[]
}

export interface NationGeometryBias {
  nation_id: string
  hide_seek_bias?: HideSeek
  truth_dare_bias?: TruthDare
  interior_exterior_bias?: InteriorExterior
}

export interface ArchetypeGeometryTendency {
  archetype_id: string
  hide_seek_tendency?: HideSeek
  truth_dare_tendency?: TruthDare
  interior_exterior_tendency?: InteriorExterior
}
