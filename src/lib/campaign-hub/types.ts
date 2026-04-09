import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector } from '@/lib/quest-grammar/types'

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
    return true
}

/** Extract completedBuilds from hub state (defaults to empty array). */
export function getCompletedBuilds(state: CampaignHubStateV1): CompletedBuildReceipt[] {
    return state.completedBuilds ?? []
}

export function hubStateMatchesKotter(state: CampaignHubStateV1, kotterStage: number): boolean {
    return state.kotterStage === kotterStage
}
