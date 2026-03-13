/**
 * Canonical Nation ↔ Element Mapping
 * 
 * This is the single source of truth for the 5 Nations and their elemental affinities.
 * Used by: diagnostic scoring, recommendation logic, starter quest routing, display.
 */

export type ElementKey = 'fire' | 'water' | 'wood' | 'metal' | 'earth'

export interface Nation {
    id: string
    name: string
    element: ElementKey
    description: string
}

export const NATIONS: Record<string, Nation> = {
    pyrakanth: { id: 'pyrakanth', name: 'Pyrakanth', element: 'fire', description: 'The blazing vanguard. Passion, action, transformation.' },
    lamenth: { id: 'lamenth', name: 'Lamenth', element: 'water', description: 'The deep current. Emotion, intuition, flow.' },
    virelune: { id: 'virelune', name: 'Virelune', element: 'wood', description: 'The living network. Growth, connection, creativity.' },
    argyra: { id: 'argyra', name: 'Argyra', element: 'metal', description: 'The silver mirror. Precision, clarity, structure.' },
    meridia: { id: 'meridia', name: 'Meridia', element: 'earth', description: 'The grounded center. Stability, nurture, endurance.' },
}

/** Reverse lookup: element → nation id */
export const ELEMENT_TO_NATION: Record<ElementKey, string> = {
    fire: 'pyrakanth',
    water: 'lamenth',
    wood: 'virelune',
    metal: 'argyra',
    earth: 'meridia',
}

/** Deterministic tie-break order (first = highest priority) */
export const ELEMENTS: ElementKey[] = ['fire', 'water', 'wood', 'metal', 'earth']

/** Known archetype keys (for signal validation) */
export const ARCHETYPE_KEYS = [
    'truth_seer',
    'shadow_walker',
    'bridge_builder',
    'flame_keeper',
    'dream_weaver',
    'story_teller',
    'root_tender',
    'void_dancer',
] as const

export type ArchetypeKey = typeof ARCHETYPE_KEYS[number]

/** All valid signal keys (elements + archetypes) */
export const VALID_SIGNAL_KEYS = [...ELEMENTS, ...ARCHETYPE_KEYS] as const

/** Get nation data by DB id (case-insensitive lookup) */
export function getNationById(id: string): Nation | undefined {
    return NATIONS[id.toLowerCase()]
}

/** Get nation data by element */
export function getNationByElement(element: ElementKey): Nation | undefined {
    const nationId = ELEMENT_TO_NATION[element]
    return nationId ? NATIONS[nationId] : undefined
}
