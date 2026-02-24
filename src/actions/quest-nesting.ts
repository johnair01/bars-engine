'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new sub-quest nested under a parent quest.
 * Costs 1 Vibeulon.
 */
export async function createSubQuest(parentId: string, data: {
    title: string,
    description: string,
    inputLabel?: string,
    inputType?: string
}) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    try {
        const result = await db.$transaction(async (tx) => {
            // 1. Check parent quest
            const parent = await tx.customBar.findUnique({
                where: { id: parentId },
                select: { id: true, rootId: true, title: true }
            })
            if (!parent) throw new Error('Parent quest not found')

            // 2. Charge 1 Vibeulon
            const wallet = await tx.vibulon.findMany({
                where: { ownerId: player.id },
                orderBy: { createdAt: 'asc' },
                take: 1
            })

            if (wallet.length < 1) {
                throw new Error('Insufficient Vibeulons to create a sub-quest (costs 1 ♦)')
            }

            const tokenToBurn = wallet[0]
            await tx.vibulon.delete({ where: { id: tokenToBurn.id } })

            // 3. Log the stake (Provenance)
            await tx.vibulonEvent.create({
                data: {
                    playerId: player.id,
                    source: 'subquest_creation',
                    amount: -1,
                    notes: `Nested under: ${parent.title}`,
                    questId: parentId,
                    archetypeMove: 'INITIATE'
                }
            })

            // 4. Create the child bar
            const inputs = JSON.stringify([
                {
                    key: 'response',
                    label: data.inputLabel || 'Response',
                    type: data.inputType || 'text',
                    placeholder: ''
                }
            ])

            const subQuest = await tx.customBar.create({
                data: {
                    creatorId: player.id,
                    title: data.title,
                    description: data.description,
                    type: 'vibe',
                    reward: 1,
                    inputs,
                    visibility: 'private', // Subquests are private by default
                    claimedById: player.id, // Assigned to self
                    parentId: parent.id,
                    rootId: parent.rootId || parent.id,
                    status: 'active'
                }
            })

            // 5. Assign to player's hand
            await tx.playerQuest.create({
                data: {
                    playerId: player.id,
                    questId: subQuest.id,
                    status: 'assigned'
                }
            })

            return subQuest
        })

        revalidatePath('/')
        return { success: true, questId: result.id }
    } catch (e: any) {
        console.error('Create sub-quest failed:', e)
        return { error: e?.message || 'Failed to create sub-quest' }
    }
}

/**
 * Appends an existing quest as a sub-quest of another.
 * Costs 1 Vibeulon.
 */
export async function appendExistingQuest(parentId: string, questId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    if (parentId === questId) return { error: 'Cannot nest a quest within itself' }

    try {
        const result = await db.$transaction(async (tx) => {
            // 1. Check parent and child
            const [parent, child] = await Promise.all([
                tx.customBar.findUnique({
                    where: { id: parentId },
                    select: { id: true, rootId: true, title: true }
                }),
                tx.customBar.findUnique({
                    where: { id: questId },
                    select: { id: true, parentId: true, title: true, claimedById: true }
                })
            ])

            if (!parent) throw new Error('Parent quest not found')
            if (!child) throw new Error('Quest to append not found')
            if (child.claimedById !== player.id) throw new Error('You do not own the quest you are trying to nest')
            if (child.parentId === parentId) throw new Error('Quest is already a sub-quest of this parent')

            // 2. Charge 1 Vibeulon
            const wallet = await tx.vibulon.findMany({
                where: { ownerId: player.id },
                orderBy: { createdAt: 'asc' },
                take: 1
            })

            if (wallet.length < 1) {
                throw new Error('Insufficient Vibeulons to append quest (costs 1 ♦)')
            }

            const tokenToBurn = wallet[0]
            await tx.vibulon.delete({ where: { id: tokenToBurn.id } })

            // 3. Log the stake
            await tx.vibulonEvent.create({
                data: {
                    playerId: player.id,
                    source: 'quest_append',
                    amount: -1,
                    notes: `Appended ${child.title} → ${parent.title}`,
                    questId: parentId,
                    archetypeMove: 'NURTURE'
                }
            })

            // 4. Update child bar
            await tx.customBar.update({
                where: { id: questId },
                data: {
                    parentId: parent.id,
                    rootId: parent.rootId || parent.id
                }
            })

            return { success: true }
        })

        revalidatePath('/')
        return result
    } catch (e: any) {
        console.error('Append quest failed:', e)
        return { error: e?.message || 'Failed to append quest' }
    }
}

/**
 * Calculates the total rewards of a quest and all its recursive children.
 */
export async function getClusterBounty(questId: string) {
    try {
        const quest = await db.customBar.findUnique({
            where: { id: questId },
            select: { id: true, rootId: true }
        })

        if (!quest) return { bounty: 0 }

        // Fetch all quests sharing the same rootId (the whole tree)
        const rootId = quest.rootId || quest.id
        const cluster = await db.customBar.findMany({
            where: {
                OR: [
                    { id: rootId },
                    { rootId: rootId }
                ]
            },
            select: { reward: true }
        })

        const total = cluster.reduce((sum, q) => sum + (q.reward || 0), 0)
        return { success: true, bounty: total }
    } catch (e) {
        return { success: false, bounty: 0, error: 'Failed to calculate bounty' }
    }
}
