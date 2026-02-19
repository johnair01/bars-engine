'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

// ============================================================
// QUEST PACKS — Unordered Quest Collections
// ============================================================

/**
 * Get all packs available to a player
 */
export async function getPlayerPacks() {
    const player = await getCurrentPlayer()
    if (!player) return []

    const packs = await db.questPack.findMany({
        where: {
            status: 'active',
            OR: [
                { creatorType: 'system' },
                { creatorId: player.id },
                { progress: { some: { playerId: player.id } } }
            ]
        },
        include: {
            quests: {
                include: { quest: true }
            },
            progress: {
                where: { playerId: player.id }
            }
        }
    })

    return packs.map(pack => {
        const completed = pack.progress[0]
            ? JSON.parse(pack.progress[0].completed) as string[]
            : []

        return {
            ...pack,
            playerProgress: pack.progress[0] || null,
            totalQuests: pack.quests.length,
            completedCount: completed.length,
            completedQuestIds: completed,
            isCreator: pack.creatorId === player.id
        }
    })
}

/**
 * Get a single pack with full details
 */
export async function getPack(packId: string) {
    const player = await getCurrentPlayer()
    if (!player) return null

    const pack = await db.questPack.findUnique({
        where: { id: packId },
        include: {
            quests: {
                include: { quest: true }
            },
            progress: {
                where: { playerId: player.id }
            }
        }
    })

    if (!pack) return null

    const completed = pack.progress[0]
        ? JSON.parse(pack.progress[0].completed) as string[]
        : []

    return {
        ...pack,
        playerProgress: pack.progress[0] || null,
        totalQuests: pack.quests.length,
        completedCount: completed.length,
        completedQuestIds: completed
    }
}

/**
 * Start a pack (create progress record)
 */
export async function startPack(packId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const existing = await db.packProgress.findUnique({
        where: {
            packId_playerId: { packId, playerId: player.id }
        }
    })

    if (existing) return { error: 'Pack already started' }

    await db.packProgress.create({
        data: {
            packId,
            playerId: player.id,
            completed: '[]'
        }
    })

    revalidatePath('/')
    return { success: true }
}

/**
 * Mark a quest as completed within a pack
 */
export async function completePackQuest(packId: string, questId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }
    const result = await completePackQuestForPlayer(player.id, packId, questId)
    revalidatePath('/')
    return result
}

/**
 * Internal logic for pack completion (test-friendly)
 */
export async function completePackQuestForPlayer(playerId: string, packId: string, questId: string) {
    const pack = await db.questPack.findUnique({
        where: { id: packId },
        include: {
            quests: true,
            progress: { where: { playerId } }
        }
    })

    if (!pack) return { error: 'Pack not found' }

    // Verify quest is in pack
    const questInPack = pack.quests.find(q => q.questId === questId)
    if (!questInPack) return { error: 'Quest not in this pack' }

    let progress = pack.progress[0]

    // Auto-start if not started
    if (!progress) {
        progress = await db.packProgress.create({
            data: {
                packId,
                playerId,
                completed: '[]'
            }
        })
    }

    const completed = JSON.parse(progress.completed) as string[]

    // Already completed?
    if (completed.includes(questId)) {
        return { error: 'Quest already completed in this pack' }
    }

    completed.push(questId)
    const isPackComplete = completed.length === pack.quests.length

    await db.packProgress.update({
        where: { id: progress.id },
        data: {
            completed: JSON.stringify(completed),
            completedAt: isPackComplete ? new Date() : null
        }
    })

    return {
        success: true,
        isPackComplete,
        completedCount: completed.length,
        totalQuests: pack.quests.length
    }
}

// ============================================================
// PLAYER PACK CREATION (via Playbook Move)
// ============================================================

/**
 * Create a player-owned pack
 * Requires specific conditions (to be implemented)
 */
export async function createPlayerPack(data: {
    title: string
    description?: string
    questIds: string[]
}) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // TODO: Verify player has the BUNDLE move or appropriate playbook
    // TODO: Verify questIds are valid and player has completed them

    if (data.questIds.length < 3 || data.questIds.length > 5) {
        return { error: 'Packs must contain 3-5 quests' }
    }

    const pack = await db.questPack.create({
        data: {
            title: data.title,
            description: data.description,
            creatorType: 'player',
            creatorId: player.id,
            quests: {
                create: data.questIds.map(questId => ({ questId }))
            }
        }
    })

    revalidatePath('/')
    return { success: true, packId: pack.id }
}

// ============================================================
// ADMIN: Pack Management
// ============================================================

/**
 * Create a system pack (admin only)
 */
export async function createSystemPack(data: {
    title: string
    description?: string
    questIds: string[]
}) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // TODO: Add admin check

    const pack = await db.questPack.create({
        data: {
            title: data.title,
            description: data.description,
            creatorType: 'system',
            quests: {
                create: data.questIds.map(questId => ({ questId }))
            }
        }
    })

    revalidatePath('/')
    return { success: true, packId: pack.id }
}

/**
 * Archive a completed pack (remove from dashboard)
 */
export async function archivePack(packId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    await db.packProgress.update({
        where: {
            packId_playerId: { packId, playerId: player.id }
        },
        data: { isArchived: true } as any
    })

    revalidatePath('/')
    return { success: true }
}
