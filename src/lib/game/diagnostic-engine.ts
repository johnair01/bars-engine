/**
 * Diagnostic Scoring Engine
 * 
 * Pure-function engine for the orientation diagnostic flow.
 * No DB calls, no side effects. Takes state in, returns state out.
 * 
 * Used by BIND actions (ADD_SIGNAL, COMPUTE_NATION, COMPUTE_ARCHETYPE)
 * to accumulate scores and produce deterministic recommendations.
 */

import {
    ELEMENTS,
    ELEMENT_TO_NATION,
    ARCHETYPE_KEYS,
    VALID_SIGNAL_KEYS,
    type ElementKey,
    type ArchetypeKey,
} from './nations'

export interface DiagnosticState {
    /** Element + archetype signal scores */
    signals: Record<string, number>
    /** Computed recommendation (nation DB id) */
    recommendedNation?: string
    /** Computed recommendation (archetype/playbook key) */
    recommendedArchetype?: string
    /** Player-confirmed selections */
    confirmed: {
        nation: boolean
        archetype: boolean
    }
}

/** Create a fresh diagnostic state */
export function createDiagnosticState(): DiagnosticState {
    return {
        signals: {},
        confirmed: { nation: false, archetype: false },
    }
}

/** 
 * Add a signal to the diagnostic state.
 * Returns a new state (immutable).
 */
export function addSignal(state: DiagnosticState, key: string, amount: number = 1): DiagnosticState {
    const normalized = key.toLowerCase()
    return {
        ...state,
        signals: {
            ...state.signals,
            [normalized]: (state.signals[normalized] || 0) + amount,
        },
    }
}

/**
 * Add multiple signals at once.
 * Accepts pairs like: { fire: 1, water: 1 }
 */
export function addSignals(state: DiagnosticState, signals: Record<string, number>): DiagnosticState {
    let next = state
    for (const [key, amount] of Object.entries(signals)) {
        next = addSignal(next, key, amount)
    }
    return next
}

/**
 * Reset signals by scope.
 * - 'nation' clears element signals
 * - 'archetype' clears archetype signals
 * - 'all' clears everything
 */
export function resetSignals(state: DiagnosticState, scope: 'nation' | 'archetype' | 'all'): DiagnosticState {
    if (scope === 'all') {
        return { ...state, signals: {}, recommendedNation: undefined, recommendedArchetype: undefined }
    }

    const keysToKeep = scope === 'nation'
        ? ARCHETYPE_KEYS as readonly string[]
        : ELEMENTS as readonly string[]

    const filtered: Record<string, number> = {}
    for (const [k, v] of Object.entries(state.signals)) {
        if (keysToKeep.includes(k)) filtered[k] = v
    }

    return {
        ...state,
        signals: filtered,
        ...(scope === 'nation' ? { recommendedNation: undefined } : { recommendedArchetype: undefined }),
    }
}

/**
 * Compute nation recommendation from element signals.
 * Deterministic tie-break: fire > water > wood > metal > earth
 */
export function computeNationRecommendation(state: DiagnosticState): DiagnosticState {
    let bestElement: ElementKey = ELEMENTS[0]
    let bestScore = -1

    for (const element of ELEMENTS) {
        const score = state.signals[element] || 0
        if (score > bestScore) {
            bestScore = score
            bestElement = element
        }
        // On tie, earlier element in ELEMENTS wins (deterministic)
    }

    return {
        ...state,
        recommendedNation: ELEMENT_TO_NATION[bestElement],
    }
}

/**
 * Compute archetype recommendation from archetype signals.
 * Deterministic tie-break: first archetype in ARCHETYPE_KEYS wins.
 */
export function computeArchetypeRecommendation(state: DiagnosticState): DiagnosticState {
    let bestArchetype: string = ARCHETYPE_KEYS[0]
    let bestScore = -1

    for (const archetype of ARCHETYPE_KEYS) {
        const score = state.signals[archetype] || 0
        if (score > bestScore) {
            bestScore = score
            bestArchetype = archetype
        }
    }

    return {
        ...state,
        recommendedArchetype: bestArchetype,
    }
}

/** Mark a selection as confirmed */
export function confirmSelection(state: DiagnosticState, kind: 'nation' | 'archetype'): DiagnosticState {
    return {
        ...state,
        confirmed: {
            ...state.confirmed,
            [kind]: true,
        },
    }
}

/** Parse diagnostic state from a JSON string (e.g., from DB). Returns fresh state if invalid. */
export function parseDiagnosticState(json: string | null | undefined): DiagnosticState {
    if (!json) return createDiagnosticState()
    try {
        const parsed = JSON.parse(json)
        if (parsed && typeof parsed === 'object' && 'signals' in parsed) {
            return parsed as DiagnosticState
        }
        return createDiagnosticState()
    } catch {
        return createDiagnosticState()
    }
}

/** Serialize diagnostic state to JSON for DB storage */
export function serializeDiagnosticState(state: DiagnosticState): string {
    return JSON.stringify(state)
}
