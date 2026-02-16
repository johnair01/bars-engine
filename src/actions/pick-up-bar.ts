'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { STARTER_BARS } from '@/lib/bars'

function parseQuestMeta(raw: string | null) {
    if (!raw) return { questSource: null as string | null, upperArchetypeId: null as string | null, lowerArchetypeId: null as string | null, mainArchetypeIds: [] as (string | null)[] }
    try {
        const parsed = JSON.parse(raw)
        return {
            questSource: typeof parsed.questSource === 'string' ? parsed.questSource : null,
            upperArchetypeId: typeof parsed.upperArchetypeId === 'string' ? parsed.upperArchetypeId : null,
            lowerArchetypeId: typeof parsed.lowerArchetypeId === 'string' ? parsed.lowerArchetypeId : null,
            mainArchetypeIds: Array.isArray(parsed.mainArchetypeIds) ? parsed.mainArchetypeIds : [],
        }
    } catch {
        return { questSource: null as string | null, upperArchetypeId: null as string | null, lowerArchetypeId: null as string | null, mainArchetypeIds: [] as (string | null)[] }
    }
}

function getEligibleArchetypeIds(meta: ReturnType<typeof parseQuestMeta>) {
    return new Set(
        [
            meta.upperArchetypeId,
            meta.lowerArchetypeId,
            ...meta.mainArchetypeIds,
        ].filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
}

export async function pickUpBar(formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const barId = formData.get('barId') as string

    // 1. Look up CustomBar in DB
    const customBar = await db.customBar.findUnique({
        where: { id: barId }
    })

    if (!customBar) {
        return { error: 'Unknown bar' }
    }

    if (customBar.status !== 'active') {
        return { error: 'Quest is not active.' }
    }

    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { id: true, playbookId: true }
    })

    const questMeta = parseQuestMeta(customBar.completionEffects)
    const isStoryClockQuest = questMeta.questSource === 'story_clock'
    const eligibleArchetypeIds = getEligibleArchetypeIds(questMeta)

    // Story Clock quests are public multi-claim quests:
    // any player can see; only eligible archetypes can claim; others can assist.
    if (isStoryClockQuest && eligibleArchetypeIds.size > 0) {
        const isEligible = !!player?.playbookId && eligibleArchetypeIds.has(player.playbookId)
        if (!isEligible) {
            return { error: 'This story quest is visible to all, but only eligible archetypes can claim it. You can still assist.' }
        }
    }

    // 2. Validate Access / Claiming
    // Check if already claimed by another player (for unique quests)
    if (!isStoryClockQuest && customBar.claimedById && customBar.claimedById !== playerId) {
        return { error: 'This quest has already been claimed by another player.' }
    }

    // Private bars logic
    if (!isStoryClockQuest && customBar.visibility === 'private' && customBar.creatorId !== playerId && !customBar.claimedById) {
        return { error: 'Private quests cannot be picked up directly.' }
    }

    // Claim the bar if not already claimed AND not a system quest
    if (!isStoryClockQuest && !customBar.claimedById && !customBar.isSystem) {
        await db.customBar.update({
            where: { id: barId },
            data: { claimedById: playerId }
        })
    }

    // 3. Create PlayerQuest (Assignment)
    try {
        const existingQuest = await db.playerQuest.findUnique({
            where: {
                playerId_questId: {
                    playerId,
                    questId: barId
                }
            }
        })

        if (existingQuest) {
            if (existingQuest.status === 'completed') {
                return { error: 'Bar already completed' }
            }
            if (existingQuest.status === 'assigned') {
                return { error: 'Bar already active' }
            }
            // If failed, we might allow retry? assuming assigned for now if extracting logic implies retry
        }

        // Create assignment
        await db.playerQuest.create({
            data: {
                playerId,
                questId: barId,
                status: 'assigned'
            }
        })

        revalidatePath('/')
        return { success: true, barId }

    } catch (e: any) {
        console.error("Pick up bar failed:", e?.message)
        return { error: 'Failed to pick up bar' }
    }
}

export async function assistStoryQuest(formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Not logged in' }

    const barId = formData.get('barId') as string
    const note = (formData.get('assistNote') as string | null)?.trim() || null
    if (!barId) return { error: 'Missing barId' }

    const customBar = await db.customBar.findUnique({
        where: { id: barId },
        select: {
            id: true,
            status: true,
            title: true,
            completionEffects: true
        }
    })

    if (!customBar) return { error: 'Unknown bar' }
    if (customBar.status !== 'active') return { error: 'Quest is not active.' }

    const questMeta = parseQuestMeta(customBar.completionEffects)
    const isStoryClockQuest = questMeta.questSource === 'story_clock'
    if (!isStoryClockQuest) {
        return { error: 'Assist is currently only available for story quests.' }
    }

    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { id: true, playbookId: true }
    })
    const eligibleArchetypeIds = getEligibleArchetypeIds(questMeta)
    const isEligibleToClaim = !!player?.playbookId && eligibleArchetypeIds.has(player.playbookId)
    if (isEligibleToClaim) {
        return { error: 'You are eligible to claim this story quest directly.' }
    }

    await db.vibulonEvent.create({
        data: {
            playerId,
            source: 'story_assist',
            amount: 0,
            questId: barId,
            notes: note || `Assist sent for story quest "${customBar.title}".`
        }
    })

    revalidatePath('/bars/available')
    revalidatePath('/story-clock')
    return { success: true }
}
