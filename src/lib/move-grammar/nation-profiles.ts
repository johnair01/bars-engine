/**
 * Move Grammar — NationFlavorProfile constants for the 5 nations.
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-3)
 *
 * Elements follow wuxing: Argyra=Metal, Pyrakanth=Fire, Lamenth=Water,
 * Virelune=Wood, Meridia=Earth.
 */

import type { NationFlavorProfile } from './index'

export const NATION_PROFILES: NationFlavorProfile[] = [
  {
    nationKey: 'argyra',
    nationName: 'Argyra',
    element: 'metal',
    register: 'crystalline',
    verbPalette: ['clarify', 'refine', 'distill', 'perceive', 'discern', 'resonate', 'align'],
    metaphorField: 'the mirror that shows what is actually there',
    moveTypeInflections: {
      create_ritual: 'through precise, crystalline attention',
      name_shadow_belief: 'with the clarity of polished metal',
      witness: 'with crystalline precision — nothing added, nothing removed',
      cast_hexagram: 'with discerning eye, reading the pattern in the metal',
      offer_blueprint: 'refined until only the essential structure remains',
    },
  },
  {
    nationKey: 'pyrakanth',
    nationName: 'Pyrakanth',
    element: 'fire',
    register: 'volcanic',
    verbPalette: ['ignite', 'combust', 'forge', 'erupt', 'surge', 'blaze', 'kindle', 'smelt'],
    metaphorField: 'the mountain that holds fire until the moment of release',
    moveTypeInflections: {
      issue_challenge: 'with volcanic force — the heat that cannot be ignored',
      propose_move: 'with the urgency of fire finding its fuel',
      declare_period: 'with thunderous clarity that echoes through the forge',
      grant_role: 'with the authority of fire that has earned its heat',
      design_layout: 'shaped by the pressure that turns carbon into something harder',
    },
  },
  {
    nationKey: 'lamenth',
    nationName: 'Lamenth',
    element: 'water',
    register: 'tidal',
    verbPalette: ['flow', 'deepen', 'dissolve', 'absorb', 'recede', 'gather', 'pool', 'permeate'],
    metaphorField: 'the tide that knows when to advance and when to yield',
    moveTypeInflections: {
      name_shadow_belief: 'with the depth of still water that holds what has sunk',
      offer_connection: 'across the tidal threshold, water finding water',
      witness: 'as water receives what falls into it — without resistance',
      host_event: 'in the estuary where currents meet and slow',
      create_ritual: 'in the rhythm of tides — what returns, what recedes',
    },
  },
  {
    nationKey: 'virelune',
    nationName: 'Virelune',
    element: 'wood',
    register: 'emergent',
    verbPalette: ['grow', 'branch', 'root', 'unfurl', 'reach', 'spread', 'cultivate', 'tend'],
    metaphorField: 'the root system that finds water before the surface knows it is dry',
    moveTypeInflections: {
      propose_move: 'with the persistence of growth finding its direction',
      offer_blueprint: 'drawn from the living structure, not imposed upon it',
      issue_challenge: 'with the patient force of roots splitting stone',
      design_layout: 'following the grain of what wants to grow here',
      host_event: 'in the clearing where the canopy opens to light',
    },
  },
  {
    nationKey: 'meridia',
    nationName: 'Meridia',
    element: 'earth',
    register: 'grounded',
    verbPalette: ['hold', 'sustain', 'nourish', 'stabilize', 'anchor', 'tend', 'bear', 'receive'],
    metaphorField: 'the field that receives what is planted without asking for credit',
    moveTypeInflections: {
      declare_period: 'with the steadiness of bedrock beneath the season',
      grant_role: 'with the generosity of soil that gives without diminishing',
      offer_connection: 'as a bridge between, held firm at both ends',
      host_event: 'in the central field where all paths converge',
      create_ritual: 'grounded in the body of the earth, returning what was borrowed',
    },
  },
]

export function getNationProfile(nationKey: string): NationFlavorProfile | undefined {
  return NATION_PROFILES.find((p) => p.nationKey === nationKey.toLowerCase())
}
