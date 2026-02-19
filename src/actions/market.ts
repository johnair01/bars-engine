'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

// ===================================
// TOWN SQUARE (MARKET) ACTIONS
// ===================================

/**
 * Get all content available in the Town Square
 */
export async function getMarketContent() {
    const player = await getCurrentPlayer()

    const [globalState, publicPacks, publicQuests] = await Promise.all([
        db.globalState.findUnique({ where: { id: 'singleton' } }),
        // 1. Feature: Public Packs (Recycled Community Packs)
        db.questPack.findMany({
            where: {
                visibility: 'public',
                status: 'active'
            },
            include: {
                quests: {
                    include: { quest: true }
                },
                progress: player ? {
                    where: { playerId: player.id }
                } : undefined
            },
            orderBy: { createdAt: 'desc' }
        }),

        // 2. Feature: Public Quests (Salad Bowl / Commissioned)
        db.customBar.findMany({
            where: {
                visibility: 'public',
                status: 'active',
                isSystem: false,
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit for now
        })
    ])

    // Filter quests
    let filteredQuests = publicQuests

    // 1. Filter story-clock quests if paused
    if (globalState?.isPaused) {
        filteredQuests = filteredQuests.filter(q => q.hexagramId === null)
    }

    // 2. Nation & Playbook Gating
    if (player) {
        filteredQuests = filteredQuests.filter(q => {
            // Nation gating
            if (q.allowedNations) {
                try {
                    const allowedNations = JSON.parse(q.allowedNations) as string[]
                    if (allowedNations.length > 0 && player.nation && !allowedNations.includes(player.nation.name)) {
                        return false
                    }
                } catch (e) {
                    // Fallback to showing if parse error, but log it
                    console.error('Error parsing allowedNations:', e)
                }
            }

            // Playbook (Trigram) gating
            if (q.allowedTrigrams) {
                try {
                    const allowedTrigrams = JSON.parse(q.allowedTrigrams) as string[]
                    if (allowedTrigrams.length > 0 && player.playbook) {
                        const playerTrigram = player.playbook.name.split(' ')[0]
                        if (!allowedTrigrams.includes(playerTrigram)) {
                            return false
                        }
                    }
                } catch (e) {
                    console.error('Error parsing allowedTrigrams:', e)
                }
            }

            return true
        })
    }

    return {
        packs: publicPacks.map(p => ({
            ...p,
            isOwned: p.progress && p.progress.length > 0
        })),
        quests: filteredQuests
    }
}

/**
 * Pickup a pack from the market
 * (Just starts it for the player)
 */
export async function pickupMarketPack(packId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // Check if valid public pack
    const pack = await db.questPack.findUnique({
        where: { id: packId }
    })

    if (!pack || (pack.visibility !== 'public' && pack.creatorId !== player.id)) {
        return { error: 'Pack not available' }
    }

    // Initialize progress if not exists
    const existing = await db.packProgress.findUnique({
        where: {
            packId_playerId: { packId, playerId: player.id }
        }
    })

    if (existing) return { error: 'Already have this pack' }

    await db.packProgress.create({
        data: {
            packId,
            playerId: player.id,
            completed: '[]'
        }
    })

    revalidatePath('/bars/available')
    revalidatePath('/')
    return { success: true }
}

/**
 * Pickup a quest from the market
 * (Assigns it to the player)
 */
export async function pickupMarketQuest(questId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const quest = await db.customBar.findUnique({
        where: { id: questId }
    })

    if (!quest || quest.visibility !== 'public') {
        return { error: 'Quest not available' }
    }

    // Check if already assigned
    const existing = await db.playerQuest.findUnique({
        where: {
            playerId_questId: { playerId: player.id, questId }
        }
    })

    if (existing) return { error: 'Already accepted this quest' }

    await db.playerQuest.create({
        data: {
            playerId: player.id,
            questId,
            status: 'assigned'
        }
    })

    revalidatePath('/bars/available')
    revalidatePath('/')
    return { success: true }
}

/**
 * Recycle a completed pack (Make it public)
 */
export async function recyclePack(packId: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // Verify ownership and completion
    const pack = await db.questPack.findUnique({
        where: { id: packId },
        include: {
            progress: { where: { playerId: player.id } }
        }
    })

    if (!pack) return { error: 'Pack not found' }
    // Only creator can recycle? Or anyone who completes it?
    // For now: Creator only can recycle TO public.
    if (pack.creatorId !== player.id) return { error: 'Only the creator can recycle this pack' }

    // Check if completed? (Optional requirement)
    // For now, let them publish anytime.

    await db.questPack.update({
        where: { id: packId },
        data: { visibility: 'public' }
    })

    revalidatePath('/bars/available')
    return { success: true }
}
