/**
 * Transformation Encounter Geometry v0 — 8 primary encounter types
 * Spec: .specify/specs/transformation-encounter-geometry/spec.md
 */

import type { EncounterType } from './types'

export const ENCOUNTER_TYPES: EncounterType[] = [
  {
    encounter_id: 'hidden_truth',
    name: 'Hidden Truth',
    coordinate: { hide_seek: 'hide', truth_dare: 'truth', interior_exterior: 'interior' },
    interaction_type: 'internal reflection, shadow recognition',
    typical_moves: ['observe', 'name', 'feel'],
  },
  {
    encounter_id: 'hidden_challenge',
    name: 'Hidden Challenge',
    coordinate: { hide_seek: 'hide', truth_dare: 'dare', interior_exterior: 'interior' },
    interaction_type: 'inner courage, internal confrontation',
    typical_moves: ['externalize', 'feel', 'experiment'],
  },
  {
    encounter_id: 'revealed_insight',
    name: 'Revealed Insight',
    coordinate: { hide_seek: 'seek', truth_dare: 'truth', interior_exterior: 'interior' },
    interaction_type: 'self-discovery, clarity generation',
    typical_moves: ['observe', 'reframe', 'integrate'],
  },
  {
    encounter_id: 'inner_breakthrough',
    name: 'Inner Breakthrough',
    coordinate: { hide_seek: 'seek', truth_dare: 'dare', interior_exterior: 'interior' },
    interaction_type: 'internal transformation, belief disruption',
    typical_moves: ['invert', 'feel', 'integrate'],
  },
  {
    encounter_id: 'protected_truth',
    name: 'Protected Truth',
    coordinate: { hide_seek: 'hide', truth_dare: 'truth', interior_exterior: 'exterior' },
    interaction_type: 'boundary clarity, truth held privately',
    typical_moves: ['name', 'observe', 'integrate'],
  },
  {
    encounter_id: 'quiet_action',
    name: 'Quiet Action',
    coordinate: { hide_seek: 'hide', truth_dare: 'dare', interior_exterior: 'exterior' },
    interaction_type: 'private behavioral change',
    typical_moves: ['experiment', 'integrate'],
  },
  {
    encounter_id: 'revealed_truth',
    name: 'Revealed Truth',
    coordinate: { hide_seek: 'seek', truth_dare: 'truth', interior_exterior: 'exterior' },
    interaction_type: 'truth sharing, communication',
    typical_moves: ['externalize', 'reframe', 'experiment'],
  },
  {
    encounter_id: 'courageous_action',
    name: 'Courageous Action',
    coordinate: { hide_seek: 'seek', truth_dare: 'dare', interior_exterior: 'exterior' },
    interaction_type: 'bold external challenge',
    typical_moves: ['invert', 'experiment', 'integrate'],
  },
]

export const MOVE_GEOMETRY_ALIGNMENT: Record<
  string,
  { hide_seek: 'hide' | 'seek'; truth_dare: 'truth' | 'dare'; interior_exterior: 'interior' | 'exterior' }
> = {
  observe: { hide_seek: 'hide', truth_dare: 'truth', interior_exterior: 'interior' },
  name: { hide_seek: 'hide', truth_dare: 'truth', interior_exterior: 'interior' },
  externalize: { hide_seek: 'seek', truth_dare: 'truth', interior_exterior: 'interior' },
  feel: { hide_seek: 'hide', truth_dare: 'truth', interior_exterior: 'interior' },
  reframe: { hide_seek: 'seek', truth_dare: 'truth', interior_exterior: 'interior' },
  invert: { hide_seek: 'seek', truth_dare: 'dare', interior_exterior: 'interior' },
  experiment: { hide_seek: 'seek', truth_dare: 'dare', interior_exterior: 'exterior' },
  integrate: { hide_seek: 'hide', truth_dare: 'truth', interior_exterior: 'interior' },
}

export const NATION_GEOMETRY_BIAS: Record<
  string,
  { hide_seek?: 'hide' | 'seek'; truth_dare?: 'truth' | 'dare'; interior_exterior?: 'interior' | 'exterior' }
> = {
  argyra: { hide_seek: 'seek', truth_dare: 'truth' },
  pyrakanth: { truth_dare: 'dare', interior_exterior: 'exterior' },
  lamenth: { hide_seek: 'hide', interior_exterior: 'interior' },
  meridia: {}, // balanced center
  virelune: { hide_seek: 'seek', interior_exterior: 'exterior' },
}

export const ARCHETYPE_GEOMETRY_TENDENCY: Record<
  string,
  { hide_seek?: 'hide' | 'seek'; truth_dare?: 'truth' | 'dare'; interior_exterior?: 'interior' | 'exterior' }
> = {
  'bold-heart': { hide_seek: 'seek', truth_dare: 'dare', interior_exterior: 'exterior' },
  'danger-walker': { hide_seek: 'seek', truth_dare: 'dare', interior_exterior: 'interior' },
  'truth-seer': { hide_seek: 'seek', truth_dare: 'truth', interior_exterior: 'interior' },
  'still-point': { hide_seek: 'hide', truth_dare: 'truth', interior_exterior: 'interior' },
  'subtle-influence': { hide_seek: 'seek', truth_dare: 'truth', interior_exterior: 'exterior' },
  'devoted-guardian': { hide_seek: 'hide', interior_exterior: 'exterior' },
  'decisive-storm': { truth_dare: 'dare', interior_exterior: 'exterior' },
  'joyful-connector': { hide_seek: 'seek', interior_exterior: 'exterior' },
}
