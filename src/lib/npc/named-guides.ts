/**
 * Named NPC Guides — the 6 characters players encounter in spoke intro rooms.
 *
 * Each NPC has a face (GM archetype), a nation affinity, and an adventure slug
 * for their authored CYOA ritual. Players learn the face system through these
 * characters, not through abstract labels.
 *
 * Shared between:
 *   - Shadow321Runner (original /shadow/321 experience)
 *   - NpcEncounterModal (spatial room encounter)
 *   - NpcRitual321 (321 reflection phase with NPC voice)
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'

export interface NPCGuide {
  id: string
  name: string
  face: GameMasterFace
  nationKey: string
  element: string
  tagline: string
  description: string
  color: string
  /** Adventure slug for this NPC's CYOA ritual. Null = not yet available. */
  adventureSlug: string | null
}

export const NPC_GUIDES: readonly NPCGuide[] = [
  {
    id: 'ignis',
    name: 'Ignis the Unbroken',
    face: 'challenger',
    nationKey: 'pyrakanth',
    element: 'fire',
    tagline: 'Passion through Friction',
    description: 'The gardener of fire. He does not coddle; he tests your commitment to the flame.',
    color: 'text-red-400',
    adventureSlug: 'ignis-trial-descent',
  },
  {
    id: 'kaelen',
    name: 'Kaelen the Moon-Caller',
    face: 'shaman',
    nationKey: 'virelune',
    element: 'wood',
    tagline: 'Spontaneous Growth',
    description: 'The mythic bridge-builder. He speaks in riddles of growth and joy, inviting you to descend.',
    color: 'text-purple-400',
    adventureSlug: null, // Not yet authored
  },
  {
    id: 'vorm',
    name: 'Vorm the Master Architect',
    face: 'architect',
    nationKey: 'argyra',
    element: 'metal',
    tagline: 'Precision for the Forge',
    description: 'The ancient sys-admin of the Silver City. He sees the world as logic and systems waiting to be solved.',
    color: 'text-orange-400',
    adventureSlug: null,
  },
  {
    id: 'aurelius',
    name: 'Aurelius the Law-Giver',
    face: 'regent',
    nationKey: 'meridia',
    element: 'earth',
    tagline: 'Balance at Noon',
    description: 'The architect of fair exchange. He believes order is the only shield against chaos.',
    color: 'text-amber-400',
    adventureSlug: null,
  },
  {
    id: 'sola',
    name: 'Sola the Heart of Lamenth',
    face: 'diplomat',
    nationKey: 'lamenth',
    element: 'water',
    tagline: 'Beauty in Tragedy',
    description: 'The finder of meaning. She translates the poignance of existence into relational power.',
    color: 'text-emerald-400',
    adventureSlug: null,
  },
  {
    id: 'witness',
    name: 'The Witness',
    face: 'sage',
    nationKey: 'all',
    element: 'all',
    tagline: 'The Meta-Observer',
    description: 'The one who has worn every mask. The Sage synthesizes the whole world into a single choice.',
    color: 'text-indigo-400',
    adventureSlug: null,
  },
] as const

/** Lookup NPC by id. */
export function getNpcById(id: string): NPCGuide | undefined {
  return NPC_GUIDES.find(n => n.id === id)
}

/** Lookup NPC by face. */
export function getNpcByFace(face: GameMasterFace): NPCGuide | undefined {
  return NPC_GUIDES.find(n => n.face === face)
}
