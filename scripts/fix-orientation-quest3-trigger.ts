import { db } from '../src/lib/db'

type TriggerInput = { trigger?: unknown }

function parseInputs(inputsJson: string | null): TriggerInput[] {
    if (!inputsJson) return []
    try {
        const parsed = JSON.parse(inputsJson)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((item): item is TriggerInput => !!item && typeof item === 'object')
    } catch {
        return []
    }
}

async function main() {
    const questId = 'orientation-quest-3'
    const quest = await db.customBar.findUnique({
        where: { id: questId }
    })

    if (!quest) {
        console.error(`❌ Quest not found: ${questId}`)
        process.exit(1)
    }

    const inputs = parseInputs(quest.inputs)
    const hasTrigger = inputs.some((input) => input?.trigger === 'ICHING_CAST')

    if (hasTrigger) {
        console.log('✅ orientation-quest-3 already has ICHING_CAST trigger.')
        return
    }

    const updatedInputs = [...inputs, { trigger: 'ICHING_CAST' }]

    await db.customBar.update({
        where: { id: questId },
        data: { inputs: JSON.stringify(updatedInputs) }
    })

    console.log('✅ Added ICHING_CAST trigger to orientation-quest-3.')
}

main()
    .catch((error) => {
        console.error('❌ Failed to patch orientation quest trigger:', error)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
