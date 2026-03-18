'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getActiveInstance } from '@/actions/instance'

/**
 * Add a personal quest to a thread.
 * Creates a ThreadQuest at the end of the thread's quest list.
 * Player must own the quest; thread must be active.
 */
export async function addQuestToThread(
    questId: string,
    threadId: string
): Promise<{ success: true } | { error: string }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    try {
        const [quest, thread] = await Promise.all([
            db.customBar.findUnique({
                where: { id: questId },
                select: { id: true, creatorId: true, claimedById: true },
            }),
            db.questThread.findUnique({
                where: { id: threadId },
                select: { id: true, status: true, quests: { select: { position: true }, orderBy: { position: 'desc' }, take: 1 } },
            }),
        ])

        if (!quest) return { error: 'Quest not found' }
        if (quest.creatorId !== player.id && quest.claimedById !== player.id) {
            return { error: 'You do not own this quest' }
        }
        if (!thread || thread.status !== 'active') return { error: 'Thread not found or inactive' }

        // Check not already in this thread
        const existing = await db.threadQuest.findUnique({
            where: { threadId_questId: { threadId, questId } },
        })
        if (existing) return { error: 'Quest is already in this thread' }

        const nextPosition = (thread.quests[0]?.position ?? 0) + 1

        await db.threadQuest.create({
            data: { threadId, questId, position: nextPosition },
        })

        revalidatePath('/hand')
        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error('[addQuestToThread]', e)
        return { error: e?.message || 'Failed to add quest to thread' }
    }
}

/**
 * Attach a personal quest as a subquest of a gameboard slot quest.
 * Sets parentId = slotQuestId and campaignRef from the slot.
 * Player must own the quest; slot quest must exist on an active gameboard slot.
 */
export async function addQuestAsSubquestToGameboard(
    questId: string,
    slotQuestId: string
): Promise<{ success: true } | { error: string }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    try {
        const [quest, slot] = await Promise.all([
            db.customBar.findUnique({
                where: { id: questId },
                select: { id: true, creatorId: true, claimedById: true, parentId: true },
            }),
            db.gameboardSlot.findFirst({
                where: { questId: slotQuestId },
                select: { campaignRef: true, questId: true },
            }),
        ])

        if (!quest) return { error: 'Quest not found' }
        if (quest.creatorId !== player.id && quest.claimedById !== player.id) {
            return { error: 'You do not own this quest' }
        }
        if (!slot) return { error: 'Gameboard slot not found for that quest' }
        if (quest.parentId === slotQuestId) return { error: 'Quest is already attached to this slot' }

        await db.customBar.update({
            where: { id: questId },
            data: {
                parentId: slotQuestId,
                campaignRef: slot.campaignRef ?? undefined,
            },
        })

        revalidatePath('/hand')
        revalidatePath('/campaign/board')
        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error('[addQuestAsSubquestToGameboard]', e)
        return { error: e?.message || 'Failed to attach quest to gameboard' }
    }
}

export type PlacementOptions = {
    threads: Array<{ id: string; title: string; description: string | null }>
    gameboardSlots: Array<{
        slotQuestId: string
        slotTitle: string
        campaignRef: string
        campaignTitle: string
    }>
}

/**
 * Return threads and gameboard slots available for quest placement.
 * Threads: orientation + threads the player has progress on.
 * Gameboard slots: slots for active instance with an assigned quest.
 */
export async function getPlacementOptionsForQuest(
    _questId: string
): Promise<PlacementOptions | { error: string }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    try {
        const [threadRows, instance] = await Promise.all([
            db.questThread.findMany({
                where: {
                    status: 'active',
                    OR: [
                        { threadType: 'orientation' },
                        { progress: { some: { playerId: player.id } } },
                    ],
                },
                select: { id: true, title: true, description: true },
                orderBy: { title: 'asc' },
            }),
            getActiveInstance(),
        ])

        const threads = threadRows
            // exclude orientation-only "build character" thread
            .filter(t => t.id !== 'build-character-thread')

        let gameboardSlots: PlacementOptions['gameboardSlots'] = []

        if (instance) {
            const slots = await db.gameboardSlot.findMany({
                where: {
                    instanceId: instance.id,
                    questId: { not: null },
                },
                select: {
                    questId: true,
                    campaignRef: true,
                    quest: { select: { title: true } },
                },
            })

            gameboardSlots = slots
                .filter(s => s.questId && s.quest)
                .map(s => ({
                    slotQuestId: s.questId!,
                    slotTitle: s.quest!.title,
                    campaignRef: s.campaignRef,
                    campaignTitle: s.campaignRef,
                }))
        }

        return { threads, gameboardSlots }
    } catch (e: any) {
        console.error('[getPlacementOptionsForQuest]', e)
        return { error: e?.message || 'Failed to get placement options' }
    }
}
