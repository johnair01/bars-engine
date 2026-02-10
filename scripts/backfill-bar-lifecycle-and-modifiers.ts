import { db } from '../src/lib/db'
import { buildReflectionModifierPayload } from '../src/lib/quest-modifiers'

type Report = {
    loggedBarsUpdated: number
    consumedBarsUpdated: number
    promotedHexBarsUpdated: number
    legacyModifierLinksFound: number
    questModifiersCreated: number
    modifierLinksSkipped: number
}

async function backfillBarStates(report: Report) {
    const loggedResult = await db.customBar.updateMany({
        where: {
            barState: 'quest',
            type: 'inspiration',
            visibility: 'private',
            status: 'active',
        },
        data: { barState: 'logged' }
    })
    report.loggedBarsUpdated = loggedResult.count

    const consumedResult = await db.customBar.updateMany({
        where: {
            barState: 'quest',
            status: 'archived',
            storyPath: 'modifier',
        },
        data: { barState: 'consumed' }
    })
    report.consumedBarsUpdated = consumedResult.count

    const promotedHexResult = await db.customBar.updateMany({
        where: {
            barState: 'quest',
            hexagramId: { not: null }
        },
        data: { barState: 'promoted' }
    })
    report.promotedHexBarsUpdated = promotedHexResult.count
}

async function backfillLegacyModifierLinks(report: Report) {
    const targets = await db.customBar.findMany({
        where: {
            storyContent: { contains: '[BAR-MOD:' }
        },
        select: {
            id: true,
            creatorId: true,
            storyContent: true
        }
    })

    for (const target of targets) {
        const storyContent = target.storyContent || ''
        const matches = Array.from(storyContent.matchAll(/\[BAR-MOD:([^\]]+)\]/g))
        const sourceIds = matches.map(match => match[1]).filter(Boolean)
        report.legacyModifierLinksFound += sourceIds.length

        for (const sourceBarId of sourceIds) {
            const existing = await db.questModifier.findUnique({
                where: {
                    sourceBarId_targetQuestId: {
                        sourceBarId,
                        targetQuestId: target.id
                    }
                }
            })
            if (existing) {
                report.modifierLinksSkipped++
                continue
            }

            const sourceBar = await db.customBar.findUnique({
                where: { id: sourceBarId },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    creatorId: true
                }
            })
            if (!sourceBar) {
                report.modifierLinksSkipped++
                continue
            }

            const payload = buildReflectionModifierPayload({
                sourceBarId: sourceBar.id,
                sourceBarTitle: sourceBar.title,
                sourceBarDescription: sourceBar.description
            })

            await db.questModifier.create({
                data: {
                    sourceBarId: sourceBar.id,
                    targetQuestId: target.id,
                    appliedById: sourceBar.creatorId || target.creatorId,
                    effectType: 'ADD_REFLECTION_INPUT',
                    payload: JSON.stringify(payload),
                    status: 'active'
                }
            })

            report.questModifiersCreated++
        }
    }
}

async function main() {
    const report: Report = {
        loggedBarsUpdated: 0,
        consumedBarsUpdated: 0,
        promotedHexBarsUpdated: 0,
        legacyModifierLinksFound: 0,
        questModifiersCreated: 0,
        modifierLinksSkipped: 0
    }

    await backfillBarStates(report)
    await backfillLegacyModifierLinks(report)

    console.log('BAR lifecycle + modifier backfill complete:')
    console.log(JSON.stringify(report, null, 2))
}

main()
    .catch((error) => {
        console.error('Backfill failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
