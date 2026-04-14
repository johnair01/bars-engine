/**
 * The 6 Big Schools — canonical face-aligned schools, one per GameMasterFace.
 *
 * These are the top-level schools (nationId = null in DB). Nation gyms are
 * derived from these by pairing each face with a nation.
 *
 * Ordered by Spiral Dynamics developmental sequence:
 *   Shaman (Magenta) → Challenger (Red) → Regent (Amber) →
 *   Architect (Orange) → Diplomat (Green) → Sage (Teal)
 *
 * Source of truth: .agent/context/game-master-sects.md
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'

export interface BigSchoolDefinition {
  /** GameMasterFace this school embodies */
  readonly portraysFace: GameMasterFace
  /** Display name */
  readonly name: string
  /** Role and mission description */
  readonly description: string
  /** Developmental sequence order (0-5) */
  readonly sortOrder: number
  /** Discriminator: always 'big_school' for the 6 canonical schools */
  readonly type: 'big_school'
}

/**
 * Immutable seed definitions for the 6 Big Schools.
 * Used by seed scripts and anywhere the canonical school list is needed.
 */
export const BIG_SCHOOLS: readonly BigSchoolDefinition[] = [
  {
    portraysFace: 'shaman',
    name: 'Shaman School',
    description:
      'Mythic threshold — belonging, ritual space, bridge between worlds. ' +
      'The Shaman school holds space for emergence and Wake Up, ' +
      'guiding students through the liminal edge where the known meets the unknown.',
    sortOrder: 0,
    type: 'big_school',
  },
  {
    portraysFace: 'challenger',
    name: 'Challenger School',
    description:
      'Proving ground — action, edge, lever. ' +
      'The Challenger school forges courage through friction, ' +
      'teaching students to find their power and Clean Up what blocks them.',
    sortOrder: 1,
    type: 'big_school',
  },
  {
    portraysFace: 'regent',
    name: 'Regent School',
    description:
      'Order and structure — roles, rules, collective tool. ' +
      'The Regent school teaches duty and hierarchy, ' +
      'training students to Show Up with discipline and serve the collective.',
    sortOrder: 2,
    type: 'big_school',
  },
  {
    portraysFace: 'architect',
    name: 'Architect School',
    description:
      'Blueprint and strategy — project, advantage, stewardship. ' +
      'The Architect school is the virtual sys-admin teacher, ' +
      'helping students Grow Up by stewarding the collective backlog with honor and amusement.',
    sortOrder: 3,
    type: 'big_school',
  },
  {
    portraysFace: 'diplomat',
    name: 'Diplomat School',
    description:
      'Relational weave — care, inclusion, connector. ' +
      'The Diplomat school cultivates the relational field, ' +
      'teaching students to weave connections and hold space for every voice.',
    sortOrder: 4,
    type: 'big_school',
  },
  {
    portraysFace: 'sage',
    name: 'Sage School',
    description:
      'Integration and emergence — systems, synthesis, meta-view. ' +
      'The Sage school is the wise trickster who sees the whole. ' +
      'Can use other faces as masks to promote outcomes from different perspectives.',
    sortOrder: 5,
    type: 'big_school',
  },
] as const

/** Lookup a Big School definition by face. */
export function getBigSchoolByFace(face: GameMasterFace): BigSchoolDefinition | undefined {
  return BIG_SCHOOLS.find((s) => s.portraysFace === face)
}

/** All 6 GameMasterFace values in developmental order. */
export const BIG_SCHOOL_FACES: readonly GameMasterFace[] = BIG_SCHOOLS.map((s) => s.portraysFace)
