import fs from 'fs'
import path from 'path'

export type BruisedBananaQuestMapCard = {
    id: string
    title: string
    emoji?: string
    description: string
    kotterStage: number
    allyshipDomain?: string
}

/**
 * Map spoke 0–7 → Q-MAP-1 … Q-MAP-8 from `data/bruised_banana_quest_map.json`.
 * Returns null if file missing or quest not found.
 */
export function loadBruisedBananaQuestMapCard(spokeIndex: number): BruisedBananaQuestMapCard | null {
    if (spokeIndex < 0 || spokeIndex > 7) return null
    const filePath = path.join(process.cwd(), 'data', 'bruised_banana_quest_map.json')
    if (!fs.existsSync(filePath)) return null
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
            quests?: Array<Record<string, unknown>>
        }
        const wantId = `Q-MAP-${spokeIndex + 1}`
        const q = raw.quests?.find((x) => x.id === wantId)
        if (!q || typeof q.title !== 'string' || typeof q.description !== 'string') return null
        return {
            id: String(q.id),
            title: q.title,
            emoji: typeof q.emoji === 'string' ? q.emoji : undefined,
            description: q.description,
            kotterStage: typeof q.kotterStage === 'number' ? q.kotterStage : spokeIndex + 1,
            allyshipDomain: typeof q.allyshipDomain === 'string' ? q.allyshipDomain : undefined,
        }
    } catch {
        return null
    }
}
