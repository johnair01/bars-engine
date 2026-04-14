import fs from 'fs'
import path from 'path'

export type MtgoaQuestMapCard = {
    id: string
    title: string
    emoji?: string
    description: string
    kotterStage: number
    allyshipDomain?: string
    predictedFeelings?: string[]
    moveApplications?: {
        wakeUp?: string
        cleanUp?: string
        growUp?: string
        showUp?: string
    }
}

export type MtgoaInstanceMeta = {
    id: string
    slug: string
    name: string
    targetDescription: string
    domainType: string
    clockType: string
    parentCampaignRef?: string
    parentSpokeIndex?: number
    bigVision: string
    desiredFeeling: string
}

const QUEST_MAP_PATH = path.join(process.cwd(), 'data', 'mtgoa_quest_map.json')

function readQuestMap(): { instance?: MtgoaInstanceMeta; quests?: Array<Record<string, unknown>> } | null {
    if (!fs.existsSync(QUEST_MAP_PATH)) return null
    try {
        return JSON.parse(fs.readFileSync(QUEST_MAP_PATH, 'utf8'))
    } catch {
        return null
    }
}

/**
 * Map spoke 0–7 → MTGOA-BG-1 … MTGOA-BG-8 from `data/mtgoa_quest_map.json`.
 * Returns null if file missing or quest not found.
 */
export function loadMtgoaQuestMapCard(spokeIndex: number): MtgoaQuestMapCard | null {
    if (spokeIndex < 0 || spokeIndex > 7) return null
    const raw = readQuestMap()
    if (!raw?.quests) return null
    const wantId = `MTGOA-BG-${spokeIndex + 1}`
    const q = raw.quests.find((x) => x.id === wantId)
    if (!q || typeof q.title !== 'string' || typeof q.description !== 'string') return null
    return {
        id: String(q.id),
        title: q.title,
        emoji: typeof q.emoji === 'string' ? q.emoji : undefined,
        description: q.description,
        kotterStage: typeof q.kotterStage === 'number' ? q.kotterStage : spokeIndex + 1,
        allyshipDomain: typeof q.allyshipDomain === 'string' ? q.allyshipDomain : undefined,
        predictedFeelings: Array.isArray(q.predictedFeelings) ? q.predictedFeelings.map(String) : undefined,
        moveApplications:
            typeof q.moveApplications === 'object' && q.moveApplications !== null
                ? (q.moveApplications as MtgoaQuestMapCard['moveApplications'])
                : undefined,
    }
}

/** Load all 8 spokes (for hub list rendering). Returns array indexed 0..7, with nulls for missing. */
export function loadAllMtgoaSpokes(): Array<MtgoaQuestMapCard | null> {
    return Array.from({ length: 8 }, (_, i) => loadMtgoaQuestMapCard(i))
}

/** Read instance metadata from the quest map (used by hub page header). */
export function loadMtgoaInstanceMeta(): MtgoaInstanceMeta | null {
    const raw = readQuestMap()
    if (!raw?.instance) return null
    return raw.instance
}
