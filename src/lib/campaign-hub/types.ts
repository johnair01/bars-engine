import { GAME_MASTER_FACES, type GameMasterFace } from '@/lib/quest-grammar/types'

/** Inline BAR summary stored in a completed build receipt (hub ledger). */
export type CompletedBuildBarSummary = {
    barId: string
    title: string
    type: 'vibe' | 'story' | 'insight'
    vibeulons: number
}

/** Emotional vector on a receipt — matches cyoa-build emotionalVectorSchema when that module ships. */
export type CompletedBuildEmotionalVector = {
    channelFrom: 'Fear' | 'Anger' | 'Sadness' | 'Joy' | 'Neutrality'
    altitudeFrom: 'dissatisfied' | 'neutral' | 'satisfied'
    channelTo: 'Fear' | 'Anger' | 'Sadness' | 'Joy' | 'Neutrality'
    altitudeTo: 'dissatisfied' | 'neutral' | 'satisfied'
}

/**
 * Immutable receipt stored in CampaignHubStateV1.completedBuilds.
 * Kept here (not imported from cyoa-build) so campaign hub compiles before that package is merged.
 */
export type CompletedBuildReceipt = {
    buildId: string
    spokeIndex: number
    face: GameMasterFace
    templateKind: string
    templateKey: string
    emotionalVector: CompletedBuildEmotionalVector
    chargeText: string
    terminalNodeId: string
    blueprintKey: string
    barSummaries: CompletedBuildBarSummary[]
    totalVibeulons: number
    completedAt: string
}

const EMOTIONAL_CHANNELS = [
    'Fear',
    'Anger',
    'Sadness',
    'Joy',
    'Neutrality',
] as const satisfies readonly CompletedBuildEmotionalVector['channelFrom'][]

const ALCHEMY_ALTITUDES = [
    'dissatisfied',
    'neutral',
    'satisfied',
] as const satisfies readonly CompletedBuildEmotionalVector['altitudeFrom'][]

function isNonEmptyString(x: unknown): x is string {
    return typeof x === 'string' && x.length > 0
}

function isGameMasterFace(x: unknown): x is GameMasterFace {
    return typeof x === 'string' && (GAME_MASTER_FACES as readonly string[]).includes(x)
}

function isEmotionalVector(x: unknown): x is CompletedBuildEmotionalVector {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    const cf = o.channelFrom
    const af = o.altitudeFrom
    const ct = o.channelTo
    const at = o.altitudeTo
    return (
        (EMOTIONAL_CHANNELS as readonly string[]).includes(cf as string) &&
        (ALCHEMY_ALTITUDES as readonly string[]).includes(af as string) &&
        (EMOTIONAL_CHANNELS as readonly string[]).includes(ct as string) &&
        (ALCHEMY_ALTITUDES as readonly string[]).includes(at as string)
    )
}

function isCompletedBuildBarSummary(x: unknown): x is CompletedBuildBarSummary {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    if (!isNonEmptyString(o.barId) || !isNonEmptyString(o.title)) return false
    if (o.type !== 'vibe' && o.type !== 'story' && o.type !== 'insight') return false
    return typeof o.vibeulons === 'number' && Number.isInteger(o.vibeulons) && o.vibeulons >= 0
}

function isCompletedBuildReceipt(x: unknown): x is CompletedBuildReceipt {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    if (!isNonEmptyString(o.buildId)) return false
    if (typeof o.spokeIndex !== 'number' || !Number.isInteger(o.spokeIndex) || o.spokeIndex < 0) {
        return false
    }
    if (!isGameMasterFace(o.face)) return false
    if (!isNonEmptyString(o.templateKind) || !isNonEmptyString(o.templateKey)) return false
    if (!isEmotionalVector(o.emotionalVector)) return false
    if (typeof o.chargeText !== 'string') return false
    if (!isNonEmptyString(o.terminalNodeId) || !isNonEmptyString(o.blueprintKey)) return false
    if (!Array.isArray(o.barSummaries) || !o.barSummaries.every(isCompletedBuildBarSummary)) {
        return false
    }
    if (typeof o.totalVibeulons !== 'number' || !Number.isInteger(o.totalVibeulons) || o.totalVibeulons < 0) {
        return false
    }
    if (typeof o.completedAt !== 'string' || o.completedAt.length === 0) return false
    return true
}

/** Persisted hub draw — invalidated when instance `kotterStage` changes. */
export type CampaignHubSpokeDrawV1 = {
    hexagramId: number
    changingLines: number[]
    primaryFace: GameMasterFace
}

export type CampaignHubStateV1 = {
    v: 1
    kotterStage: number
    spokes: CampaignHubSpokeDrawV1[]
    /** Optional CYOA build receipts appended on ceremony completion (hub ledger). */
    completedBuilds?: CompletedBuildReceipt[]
    updatedAt: string
}

export function isCampaignHubStateV1(x: unknown): x is CampaignHubStateV1 {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    if (o.v !== 1) return false
    if (typeof o.kotterStage !== 'number') return false
    if (!Array.isArray(o.spokes) || o.spokes.length !== 8) return false
    if (typeof o.updatedAt !== 'string') return false
    for (const s of o.spokes) {
        if (!s || typeof s !== 'object') return false
        const sp = s as Record<string, unknown>
        if (typeof sp.hexagramId !== 'number') return false
        if (!Array.isArray(sp.changingLines)) return false
        if (typeof sp.primaryFace !== 'string') return false
    }
    if (o.completedBuilds !== undefined) {
        if (!Array.isArray(o.completedBuilds)) return false
        if (!o.completedBuilds.every(isCompletedBuildReceipt)) return false
    }
    return true
}

/** Ledger receipts stored on hub state (empty when field absent or legacy JSON). */
export function getCompletedBuilds(state: CampaignHubStateV1): CompletedBuildReceipt[] {
    return state.completedBuilds ?? []
}

export function hubStateMatchesKotter(state: CampaignHubStateV1, kotterStage: number): boolean {
    return state.kotterStage === kotterStage
}
