import { db } from '../src/lib/db'

type StarterPackData = {
    completedBars?: Array<{ id: string; inputs?: Record<string, unknown> }>
    activeBars?: string[]
    [key: string]: unknown
}

function stripLegacyIChingActiveBars(data: StarterPackData): { next: StarterPackData; removed: number } {
    const activeBars = Array.isArray(data.activeBars) ? data.activeBars : []
    const filtered = activeBars.filter((id) => !/^iching_\d+$/.test(id))
    const removed = activeBars.length - filtered.length

    if (removed === 0) {
        return { next: data, removed: 0 }
    }

    return {
        next: { ...data, activeBars: filtered },
        removed
    }
}

async function main() {
    const packs = await db.starterPack.findMany({
        select: { id: true, playerId: true, data: true }
    })

    let updatedPacks = 0
    let removedEntries = 0

    for (const pack of packs) {
        let parsed: StarterPackData
        try {
            parsed = JSON.parse(pack.data || '{}')
        } catch {
            console.warn(`Skipping pack ${pack.id} (invalid JSON)`)
            continue
        }

        const { next, removed } = stripLegacyIChingActiveBars(parsed)
        if (removed === 0) continue

        await db.starterPack.update({
            where: { id: pack.id },
            data: { data: JSON.stringify(next) }
        })

        updatedPacks += 1
        removedEntries += removed
        console.log(`Updated ${pack.id} (player ${pack.playerId}) - removed ${removed} legacy entries`)
    }

    console.log(`Done. Updated ${updatedPacks} starter packs, removed ${removedEntries} legacy iching activeBars entries.`)
}

main()
    .catch((error) => {
        console.error('Failed to clean legacy I Ching active bars:', error)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
