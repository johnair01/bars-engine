export enum VisibilityAxis {
    HIDE = 'HIDE',
    SEEK = 'SEEK',
}

export enum RevelationAxis {
    TRUTH = 'TRUTH',
    DARE = 'DARE',
}

export enum DirectionAxis {
    INTERIOR = 'INTERIOR',
    EXTERIOR = 'EXTERIOR',
}

export type EncounterState =
    | 'HIDE_TRUTH_INTERIOR'
    | 'HIDE_TRUTH_EXTERIOR'
    | 'HIDE_DARE_INTERIOR'
    | 'HIDE_DARE_EXTERIOR'
    | 'SEEK_TRUTH_INTERIOR'
    | 'SEEK_TRUTH_EXTERIOR'
    | 'SEEK_DARE_INTERIOR'
    | 'SEEK_DARE_EXTERIOR'

export type CubeGeometry = {
    visibility: VisibilityAxis
    revelation: RevelationAxis
    direction: DirectionAxis
    state: EncounterState
}

type AxisWeights<T extends string> = Partial<Record<T, number>>

export type CubeBias = {
    visibility?: AxisWeights<VisibilityAxis>
    revelation?: AxisWeights<RevelationAxis>
    direction?: AxisWeights<DirectionAxis>
}

export interface CubeBiasProvider {
    getBiasForHexagram(hexagramId: number): CubeBias | null
}

/**
 * Placeholder for future per-hexagram weighting.
 * Leave empty for uniform cube behavior.
 */
export const PLACEHOLDER_CUBE_BIAS_BY_HEXAGRAM: Record<number, CubeBias> = {}

class StaticCubeBiasProvider implements CubeBiasProvider {
    constructor(private readonly biasByHexagram: Record<number, CubeBias>) { }

    getBiasForHexagram(hexagramId: number): CubeBias | null {
        return this.biasByHexagram[hexagramId] ?? null
    }
}

export class DefaultCubeBiasProvider implements CubeBiasProvider {
    getBiasForHexagram(_hexagramId: number): CubeBias | null {
        return null
    }
}

export const defaultCubeBiasProvider: CubeBiasProvider =
    Object.keys(PLACEHOLDER_CUBE_BIAS_BY_HEXAGRAM).length > 0
        ? new StaticCubeBiasProvider(PLACEHOLDER_CUBE_BIAS_BY_HEXAGRAM)
        : new DefaultCubeBiasProvider()

export type CubeRng = () => number

const VISIBILITY_VALUES = [VisibilityAxis.HIDE, VisibilityAxis.SEEK] as const
const REVELATION_VALUES = [RevelationAxis.TRUTH, RevelationAxis.DARE] as const
const DIRECTION_VALUES = [DirectionAxis.INTERIOR, DirectionAxis.EXTERIOR] as const

function normalizeWeight(value: number | undefined) {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
        return 1
    }
    return value
}

function pickWeighted<T extends string>(
    values: readonly T[],
    axisBias: AxisWeights<T> | undefined,
    rng: CubeRng
): T {
    const weights = values.map((value) => normalizeWeight(axisBias?.[value]))
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    const fallbackUniform = total <= 0

    const threshold = rng() * (fallbackUniform ? values.length : total)
    let cumulative = 0

    for (let i = 0; i < values.length; i += 1) {
        cumulative += fallbackUniform ? 1 : weights[i]
        if (threshold <= cumulative) {
            return values[i]
        }
    }

    return values[values.length - 1]
}

function hashSeed(seed: string | number) {
    const text = String(seed)
    let hash = 2166136261
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
}

export function createSeededRng(seed: string | number): CubeRng {
    let state = hashSeed(seed) || 0x12345678
    return () => {
        state += 0x6D2B79F5
        let t = state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function assignCubeGeometry(params: {
    hexagramId: number
    bias?: CubeBias | null
    seed?: string | number
    rng?: CubeRng
}): CubeGeometry {
    const rng = params.rng ?? createSeededRng(params.seed ?? params.hexagramId)
    const bias = params.bias ?? null

    const visibility = pickWeighted(VISIBILITY_VALUES, bias?.visibility, rng)
    const revelation = pickWeighted(REVELATION_VALUES, bias?.revelation, rng)
    const direction = pickWeighted(DIRECTION_VALUES, bias?.direction, rng)
    const state = `${visibility}_${revelation}_${direction}` as EncounterState

    return {
        visibility,
        revelation,
        direction,
        state,
    }
}

export function formatCubeGeometry(geometry: CubeGeometry) {
    return `${geometry.visibility} + ${geometry.revelation} + ${geometry.direction}`
}
