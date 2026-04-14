/**
 * The 5 Canonical Nations — elemental nations aligned to the Wuxing cycle.
 *
 * Each nation maps to one of the five Wuxing elements:
 *   Metal (Argyra) → Water (Lamenth) → Wood (Virelune) → Fire (Pyrakanth) → Earth (Meridia)
 *
 * Nations have NO prescribed face affinity — affinity is emergent through play.
 * Each nation gets 6 gyms (one per GameMasterFace) seeded as Schools with nationId.
 *
 * Lifecycle moves follow the bars-engine developmental spiral:
 *   Wake Up → Clean Up → Grow Up → Show Up
 *
 * Source of truth for nation identity. Used by:
 * - prisma/seed.ts (main seed)
 * - scripts/seed-nations.ts (standalone idempotent seed)
 * - CYOA Composer build contract (nation selection step)
 */

export type WuxingElement = 'metal' | 'water' | 'wood' | 'fire' | 'earth'

/** Wuxing shēng (生) generation cycle order. */
export const WUXING_CYCLE: readonly WuxingElement[] = [
  'metal',
  'water',
  'wood',
  'fire',
  'earth',
] as const

export interface NationDefinition {
  /** Display name */
  readonly name: string
  /** Thematic tagline */
  readonly description: string
  /** Wuxing element alignment */
  readonly element: WuxingElement
  /** Default image path (relative to /public) */
  readonly imgUrl: string
  /** Wake Up lifecycle prompt — initial awareness */
  readonly wakeUp: string
  /** Clean Up lifecycle prompt — release and transformation */
  readonly cleanUp: string
  /** Grow Up lifecycle prompt — capacity building */
  readonly growUp: string
  /** Show Up lifecycle prompt — presence and action */
  readonly showUp: string
  /** Sort order matching Wuxing generation cycle */
  readonly sortOrder: number
}

/**
 * Immutable seed definitions for the 5 canonical nations.
 * Ordered by Wuxing shēng (生) generation cycle: Metal → Water → Wood → Fire → Earth.
 */
export const NATIONS: readonly NationDefinition[] = [
  {
    name: 'Argyra',
    description: 'The Silver City. Logic, reflection, and mirrors.',
    element: 'metal',
    imgUrl: '/nations/argyra.png',
    wakeUp: 'Mirror Meditation: See yourself clearly by examining your reflections in others.',
    cleanUp: 'Silver Purge: Dissolve illusions and false beliefs through logical analysis.',
    growUp: 'Crystal Lattice: Build systematic frameworks for understanding complexity.',
    showUp: 'Calculated Action: Execute with precision based on thorough analysis.',
    sortOrder: 0,
  },
  {
    name: 'Lamenth',
    description: 'The Weeping Stone. Memory, history, and foundations.',
    element: 'water',
    imgUrl: '/nations/lamenth.png',
    wakeUp: 'Ancestral Sight: Remember the wisdom embedded in your lineage.',
    cleanUp: 'Stone Grief: Honor old pain by allowing it to fully pass through.',
    growUp: 'Foundation Building: Grow by deeply understanding where you came from.',
    showUp: 'Enduring Presence: Act with the weight of history behind you.',
    sortOrder: 1,
  },
  {
    name: 'Virelune',
    description: 'The Green Moon. Joy, vitality, and unstoppable growth.',
    element: 'wood',
    imgUrl: '/nations/virelune.png',
    wakeUp: 'Vitality Sense: Notice where life force is rising and what wants to grow.',
    cleanUp: 'Growth Around: Let obstacles become compost; expand around what blocks you.',
    growUp: 'Sustained Bloom: Build capacity for joy that outlasts the moment.',
    showUp: 'Life Force Forward: Act with the energy of something coming alive.',
    sortOrder: 2,
  },
  {
    name: 'Pyrakanth',
    description: 'The Burning Garden. Passion, consumption, and growth.',
    element: 'fire',
    imgUrl: '/nations/pyrakanth.png',
    wakeUp: 'Ember Vision: Let passion illuminate what truly matters to you.',
    cleanUp: 'Burn Offering: Transform old wounds into fuel for new growth.',
    growUp: 'Wild Cultivation: Nurture your desires into full bloom through devoted care.',
    showUp: 'Blaze Forward: Act with full intensity and commitment.',
    sortOrder: 3,
  },
  {
    name: 'Meridia',
    description: 'The Golden Noon. Clarity, trade, and exchange.',
    element: 'earth',
    imgUrl: '/nations/meridia.png',
    wakeUp: 'Noon Clarity: Stand in the full light and see all things as they are.',
    cleanUp: 'Fair Exchange: Release attachments by trading old for new.',
    growUp: 'Market Mastery: Learn the art of value creation and exchange.',
    showUp: 'Golden Deal: Take action through negotiation and mutual benefit.',
    sortOrder: 4,
  },
] as const

/** All 5 nation names in Wuxing generation cycle order. */
export const NATION_NAMES: readonly string[] = NATIONS.map((n) => n.name)

/** All 5 Wuxing elements in generation cycle order. */
export const NATION_ELEMENTS: readonly WuxingElement[] = NATIONS.map((n) => n.element)

/** Lookup a nation definition by name (case-insensitive). */
export function getNationByName(name: string): NationDefinition | undefined {
  return NATIONS.find((n) => n.name.toLowerCase() === name.toLowerCase())
}

/** Lookup a nation definition by Wuxing element. */
export function getNationByElement(element: WuxingElement): NationDefinition | undefined {
  return NATIONS.find((n) => n.element === element)
}

/** Total number of nation gyms: 5 nations × 6 faces = 30. */
export const NATION_GYM_COUNT = 30
