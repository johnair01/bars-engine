'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

// ============================================================
// QUEST THREADS — Sequential Quest Journeys
// ============================================================

/**
 * Get all threads available to a player
 * - Includes orientation threads (auto-assigned to all)
 * - Includes threads player has explicitly joined
 */
export async function getPlayerThreads() {
    const player = await getCurrentPlayer()
    if (!player) return []

    // Get all orientation threads + threads player has progress on
    const threads = await db.questThread.findMany({
        where: {
            status: 'active',
            OR: [
                { threadType: 'orientation' },
                { progress: { some: { playerId: player.id } } }
            ]
        },
        include: {
            quests: {
                orderBy: { position: 'asc' },
                include: { quest: true }
            },
            progress: {
                where: { playerId: player.id }
            }
        }
    })

    return threads.map(thread => ({
        ...thread,
        playerProgress: thread.progress[0] || null,
        totalQuests: thread.quests.length,
        currentQuest: thread.quests.find(
            q => q.position === (thread.progress[0]?.currentPosition || 1)
        )
    }))
}

/**
 * Get a single thread with full details
 */
export async function getThread(threadId: string) {
    const player = await getCurrentPlayer()
    if (!player) return null

    const thread = await db.questThread.findUnique({
        where: { id: threadId },
        include: {
            quests: {
                orderBy: { position: 'asc' },
                include: { quest: true }
            },
            progress: {
                where: { playerId: player.id }
            }
        }
    })

    if (!thread) return null

    return {
        ...thread,
        playerProgress: thread.progress[0] || null,
        totalQuests: thread.quests.length
    }
}

/**
 * Start a thread (create progress record)
 */
export async function startThread(threadId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // Check if already started
    const existing = await db.threadProgress.findUnique({
        where: {
            threadId_playerId: { threadId, playerId: player.id }
        }
    })

    if (existing) return { error: 'Thread already started' }

    await db.threadProgress.create({
        data: {
            threadId,
            playerId: player.id,
            currentPosition: 1
        }
    })

    revalidatePath('/')
    return { success: true }
}

/**
 * Complete current quest in thread and advance to next
 */
export async function advanceThread(threadId: string, questId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }
    const result = await advanceThreadForPlayer(player.id, threadId, questId)
    revalidatePath('/')
    return result
}

/**
 * Internal logic for thread advancement (test-friendly)
 */
export async function advanceThreadForPlayer(
    playerId: string,
    threadId: string,
    questId: string,
    tx?: any // Allow passing a transaction client
) {
    const client = tx || db
    const thread = await client.questThread.findUnique({
        where: { id: threadId },
        include: {
            quests: { orderBy: { position: 'asc' }, include: { quest: { include: { microTwine: true } } } },
            progress: { where: { playerId } }
        }
    })

    if (!thread) return { error: 'Thread not found' }

    const progress = thread.progress[0]
    if (!progress) return { error: 'Thread not started' }

    // Verify the quest being completed is the current one
    const currentQuest = thread.quests.find((q: any) => q.position === progress.currentPosition)
    if (!currentQuest || currentQuest.questId !== questId) {
        return { error: 'This is not the current quest in the thread' }
    }

    const nextPosition = progress.currentPosition + 1
    const isComplete = nextPosition > thread.quests.length

    await client.threadProgress.update({
        where: { id: progress.id },
        data: {
            currentPosition: nextPosition,
            completedAt: isComplete ? new Date() : null
        }
    })

    // If thread complete, award completion reward
    if (isComplete && thread.completionReward > 0) {
        // 1. Log the event
        await client.vibulonEvent.create({
            data: {
                playerId,
                source: 'thread_completion',
                amount: thread.completionReward,
                archetypeMove: 'IMMOVABLE', // Mountain trigram for anchoring
                notes: `Completed thread: ${thread.title}`
            }
        })

        // 2. Mint actual tokens
        const tokenData = []
        for (let i = 0; i < thread.completionReward; i++) {
            tokenData.push({
                ownerId: playerId,
                originSource: 'thread_completion',
                originId: threadId,
                originTitle: thread.title
            })
        }
        await client.vibulon.createMany({ data: tokenData })
    } else if (!isComplete) {
        // RECURSIVE CHECK: Is the *next* quest already done?
        // DISABLED for orientation threads to ensure players see the full narrative journey
        if (thread.threadType !== 'orientation') {
            const nextQuest = thread.quests.find((q: any) => q.position === nextPosition)
            if (nextQuest) {
                const assignment = await client.playerQuest.findFirst({
                    where: {
                        playerId,
                        questId: nextQuest.questId,
                        status: 'completed'
                    }
                })

                if (assignment) {
                    console.log(`Auto-advancing thread ${threadId} past already-completed quest ${nextQuest.questId}`)
                    await advanceThreadForPlayer(playerId, threadId, nextQuest.questId, tx)
                }
            }
        }
    }

    return {
        success: true,
        isComplete,
        nextPosition: isComplete ? null : nextPosition,
        threadType: thread.threadType
    }
}

/**
 * Auto-assign orientation threads to a new player
 * Called during character creation
 */
export async function assignOrientationThreads(playerId: string) {
    const orientationThreads = await db.questThread.findMany({
        where: { threadType: 'orientation', status: 'active' }
    })

    for (const thread of orientationThreads) {
        try {
            // Use upsert with a try-catch for maximum resilience against race conditions in parallel requests
            await db.threadProgress.upsert({
                where: {
                    threadId_playerId: {
                        threadId: thread.id,
                        playerId: playerId
                    }
                },
                update: {}, // No changes if it exists
                create: {
                    threadId: thread.id,
                    playerId,
                    currentPosition: 1
                }
            })
        } catch (error: any) {
            // If it's a unique constraint error (P2002), we can safely ignore it as 
            // the record clearly already exists.
            if (error.code === 'P2002') {
                console.info(`[QuestThread] Orientation thread ${thread.id} already assigned to ${playerId}, ignoring race condition.`)
            } else {
                console.error(`[QuestThread] Failed to assign orientation thread ${thread.id}:`, error)
                throw error
            }
        }
    }
}

// ============================================================
// ADMIN: Thread Management
// ============================================================

/**
 * Create a new thread (admin only)
 */
export async function createThread(data: {
    title: string
    description?: string
    threadType: 'orientation' | 'standard'
    questIds: string[]
    completionReward?: number
}) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // TODO: Add admin check

    const thread = await db.questThread.create({
        data: {
            title: data.title,
            description: data.description,
            threadType: data.threadType,
            creatorType: 'admin',
            creatorId: player.id,
            completionReward: data.completionReward || 0,
            quests: {
                create: data.questIds.map((questId, index) => ({
                    questId,
                    position: index + 1
                }))
            }
        }
    })

    revalidatePath('/')
    return { success: true, threadId: thread.id }
}

/**
 * Archive a completed thread (remove from main dashboard)
 */
export async function archiveThread(threadId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    await db.threadProgress.update({
        where: {
            threadId_playerId: { threadId, playerId: player.id }
        },
        data: { isArchived: true } as any
    })

    revalidatePath('/')
    return { success: true }
}
