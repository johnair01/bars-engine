import type { AlchemyAltitude } from '@/lib/alchemy/types'
import {
    GAME_MASTER_FACES,
    type EmotionalChannel,
    type EmotionalVector,
    type GameMasterFace,
} from '@/lib/quest-grammar/types'

const EMOTIONAL_CHANNELS: readonly EmotionalChannel[] = [
    'Fear',
    'Anger',
    'Sadness',
    'Joy',
    'Neutrality',
]

const ALCHEMY_ALTITUDES: readonly AlchemyAltitude[] = ['dissatisfied', 'neutral', 'satisfied']

function isEmotionalChannel(x: unknown): x is EmotionalChannel {
    return typeof x === 'string' && (EMOTIONAL_CHANNELS as readonly string[]).includes(x)
}

function isAlchemyAltitude(x: unknown): x is AlchemyAltitude {
    return typeof x === 'string' && (ALCHEMY_ALTITUDES as readonly string[]).includes(x)
}

function isEmotionalVector(v: unknown): v is EmotionalVector {
    if (!v || typeof v !== 'object') return false
    const o = v as Record<string, unknown>
    return (
        isEmotionalChannel(o.channelFrom) &&
        isAlchemyAltitude(o.altitudeFrom) &&
        isEmotionalChannel(o.channelTo) &&
        isAlchemyAltitude(o.altitudeTo)
    )
}

function isCompletedBuildBarSummary(u: unknown): u is CompletedBuildBarSummary {
    if (!u || typeof u !== 'object') return false
    const b = u as Record<string, unknown>
    if (typeof b.barId !== 'string' || typeof b.title !== 'string') return false
    if (b.type !== 'vibe' && b.type !== 'story' && b.type !== 'insight') return false
    if (typeof b.vibeulons !== 'number') return false
    return true
}

function isCompletedBuildReceipt(u: unknown): u is CompletedBuildReceipt {
    if (!u || typeof u !== 'object') return false
    const r = u as Record<string, unknown>
    if (typeof r.buildId !== 'string') return false
    if (typeof r.spokeIndex !== 'number') return false
    if (typeof r.face !== 'string' || !GAME_MASTER_FACES.includes(r.face as GameMasterFace)) return false
    if (typeof r.templateKind !== 'string' || typeof r.templateKey !== 'string') return false
    if (!isEmotionalVector(r.emotionalVector)) return false
    if (typeof r.chargeText !== 'string') return false
    if (typeof r.terminalNodeId !== 'string' || typeof r.blueprintKey !== 'string') return false
    if (!Array.isArray(r.barSummaries) || !r.barSummaries.every(isCompletedBuildBarSummary)) return false
    if (typeof r.totalVibeulons !== 'number' || typeof r.completedAt !== 'string') return false
    return true
}

/** Persisted hub draw — invalidated when instance `kotterStage` changes. */
export type CampaignHubSpokeDrawV1 = {
    hexagramId: number
    changingLines: number[]
    primaryFace: GameMasterFace
}

/** Inline BAR summary stored in a completed build receipt. */
export type CompletedBuildBarSummary = {
    barId: string
    title: string
    type: 'vibe' | 'story' | 'insight'
    vibeulons: number
}

/** Immutable receipt stored in CampaignHubStateV1.completedBuilds. */
export type CompletedBuildReceipt = {
    buildId: string
    spokeIndex: number
    face: GameMasterFace
    templateKind: string
    templateKey: string
    emotionalVector: EmotionalVector
    chargeText: string
    terminalNodeId: string
    blueprintKey: string
    barSummaries: CompletedBuildBarSummary[]
    totalVibeulons: number
    completedAt: string
}

export type CampaignHubStateV1 = {
    v: 1
    kotterStage: number
    spokes: CampaignHubSpokeDrawV1[]
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

/** Extract completedBuilds from hub state (defaults to empty array). */
export function getCompletedBuilds(state: CampaignHubStateV1): CompletedBuildReceipt[] {
    return state.completedBuilds ?? []
}

export function hubStateMatchesKotter(state: CampaignHubStateV1, kotterStage: number): boolean {
    return state.kotterStage === kotterStage
}
