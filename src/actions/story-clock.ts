'use server'

import { db } from '@/lib/db'
import { getHexagramStructure } from '@/lib/iching-struct'

type StoryClockRolloverPolicy = 'carry_unfinished' | 'archive_unfinished'

function resolveRolloverPolicy(value: unknown): StoryClockRolloverPolicy {
    if (value === 'archive_unfinished') return 'archive_unfinished'
    return 'carry_unfinished'
}

function parseFeaturesJson(raw: string | null): Record<string, unknown> {
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw)
        return typeof parsed === 'object' && parsed ? parsed as Record<string, unknown> : {}
    } catch {
        return {}
    }
}

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
            questsByPeriod: {},
            rolloverPolicy: 'carry_unfinished' as StoryClockRolloverPolicy
        }
    }

    const sequence = JSON.parse(globalState.hexagramSequence) as number[]
    const appConfig = await db.appConfig.findUnique({
        where: { id: 'singleton' },
        select: { features: true }
    })
    const features = parseFeaturesJson(appConfig?.features || '{}')
    const rolloverPolicy = resolveRolloverPolicy(features.storyClockRolloverPolicy)

    // Canonical trigram -> archetype mapping (via playbook element metadata)
    const playbooks = await db.playbook.findMany({
        select: { id: true, name: true, description: true }
    })
    const playbookByElement = new Map(
        playbooks
            .map(playbook => {
                const match = playbook.description?.match(/Element:\s*([A-Za-z]+)/i)
                return match?.[1]
                    ? [match[1].toLowerCase(), { id: playbook.id, name: playbook.name }] as const
                    : null
            })
            .filter((entry): entry is readonly [string, { id: string, name: string }] => !!entry)
    )

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
        const meta = parseStoryClockMeta(quest.completionEffects)
        const structure = quest.hexagramId ? getHexagramStructure(quest.hexagramId) : null
        const derivedUpper = structure ? playbookByElement.get(structure.upper.toLowerCase()) || null : null
        const derivedLower = structure ? playbookByElement.get(structure.lower.toLowerCase()) || null : null

        const upperArchetypeId = meta.upperArchetypeId || meta.mainArchetypeIds?.[0] || derivedUpper?.id || null
        const upperArchetypeName = meta.upperArchetypeName || derivedUpper?.name || meta.mainArchetypeName || 'Unknown archetype'
        const lowerArchetypeId = meta.lowerArchetypeId || meta.mainArchetypeIds?.[1] || derivedLower?.id || null
        const lowerArchetypeName = meta.lowerArchetypeName || derivedLower?.name || meta.mainArchetypeName || 'Unknown archetype'

        questsByPeriod[period].push({
            id: quest.id,
            title: quest.title,
            description: quest.description,
            hexagramId: quest.hexagramId,
            reward: quest.reward,
            completionEffects: quest.completionEffects,
            upperArchetypeId,
            upperArchetypeName,
            lowerArchetypeId,
            lowerArchetypeName,
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
        questsByPeriod,
        rolloverPolicy
    }
}

function parseStoryClockMeta(raw: string | null) {
    if (!raw) {
        return {
            mainArchetypeIds: null as (string | null)[] | null,
            mainArchetypeName: null as string | null,
            upperArchetypeId: null as string | null,
            upperArchetypeName: null as string | null,
            lowerArchetypeId: null as string | null,
            lowerArchetypeName: null as string | null
        }
    }

    try {
        const parsed = JSON.parse(raw)
        return {
            mainArchetypeIds: Array.isArray(parsed.mainArchetypeIds) ? parsed.mainArchetypeIds : null,
            mainArchetypeName: typeof parsed.mainArchetypeName === 'string' ? parsed.mainArchetypeName : null,
            upperArchetypeId: typeof parsed.upperArchetypeId === 'string' ? parsed.upperArchetypeId : null,
            upperArchetypeName: typeof parsed.upperArchetypeName === 'string' ? parsed.upperArchetypeName : null,
            lowerArchetypeId: typeof parsed.lowerArchetypeId === 'string' ? parsed.lowerArchetypeId : null,
            lowerArchetypeName: typeof parsed.lowerArchetypeName === 'string' ? parsed.lowerArchetypeName : null
        }
    } catch {
        return {
            mainArchetypeIds: null as (string | null)[] | null,
            mainArchetypeName: null as string | null,
            upperArchetypeId: null as string | null,
            upperArchetypeName: null as string | null,
            lowerArchetypeId: null as string | null,
            lowerArchetypeName: null as string | null
        }
    }
}
