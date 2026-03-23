import type { GameMasterFace } from '@/lib/quest-grammar/types'

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

export function hubStateMatchesKotter(state: CampaignHubStateV1, kotterStage: number): boolean {
    return state.kotterStage === kotterStage
}
