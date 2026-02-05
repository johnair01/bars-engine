'use server'

import { db } from '@/lib/db'

/**
 * Get Story Clock data including current period, quests by period, and completion tracking
 */
export async function getStoryClockData() {
    const globalState = await db.globalState.findUnique({
        where: { id: 'singleton' }
    })

    if (!globalState) {
        return {
            currentPeriod: 1,
            storyClock: 0,
            isPaused: false,
            hexagramSequence: [],
            questsByPeriod: {}
        }
    }

    const sequence = JSON.parse(globalState.hexagramSequence) as number[]

    // Fetch all story quests (quests with hexagramId)
    const storyQuests = await db.customBar.findMany({
        where: {
            hexagramId: { not: null },
            status: 'active'
        },
        include: {
            assignments: {
                where: { status: 'completed' },
                take: 1,
                orderBy: { completedAt: 'asc' },
                include: {
                    player: {
                        select: { id: true, name: true }
                    }
                }
            }
        },
        orderBy: { periodGenerated: 'asc' }
    })

    // Group quests by period
    const questsByPeriod: Record<number, any[]> = {}
    storyQuests.forEach(quest => {
        const period = quest.periodGenerated || 1
        if (!questsByPeriod[period]) {
            questsByPeriod[period] = []
        }

        const firstCompleter = quest.assignments[0]?.player

        questsByPeriod[period].push({
            id: quest.id,
            title: quest.title,
            description: quest.description,
            hexagramId: quest.hexagramId,
            reward: quest.reward,
            firstCompleter: firstCompleter ? {
                id: firstCompleter.id,
                name: firstCompleter.name
            } : null,
            isOldPeriod: period < globalState.currentPeriod
        })
    })

    return {
        currentPeriod: globalState.currentPeriod,
        storyClock: globalState.storyClock,
        isPaused: globalState.isPaused,
        hexagramSequence: sequence,
        questsByPeriod
    }
}
