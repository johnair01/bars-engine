import type { GameMasterFace } from '@/lib/quest-grammar/types'
import {
    parseCompletedBuildReceipts,
    type CompletedBuildReceiptParsed,
    type CompletedBuildBarSummaryParsed,
} from '@/lib/cyoa-build/schemas'

/** Hub ledger receipt — canonical runtime validation in cyoa-build Zod schemas. */
export type CompletedBuildReceipt = CompletedBuildReceiptParsed
export type CompletedBuildBarSummary = CompletedBuildBarSummaryParsed

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
        const parsed = parseCompletedBuildReceipts(o.completedBuilds)
        if (!parsed.success) return false
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
