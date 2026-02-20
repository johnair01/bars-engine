'use server'

/**
 * @deprecated This module uses boolean flags on the Player model for onboarding tracking.
 * The new system uses QuestThread (threadType: 'orientation') with completionEffects.
 * See: quest-engine.ts processCompletionEffects() and seed-onboarding-thread.ts.
 * These functions remain for backward compatibility — new code should use the thread system.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer, requirePlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Get onboarding status for current player
 */
export async function getOnboardingStatus(playerId?: string) {
    let player
    if (playerId) {
        player = await db.player.findUnique({ where: { id: playerId } })
    } else {
        player = await getCurrentPlayer()
    }

    if (!player) return { error: 'Not logged in' }

    const onboarding = await db.player.findUnique({
        where: { id: player.id },
        select: {
            hasSeenWelcome: true,
            hasCompletedFirstQuest: true,
            hasCreatedFirstQuest: true,
            onboardingCompletedAt: true
        }
    })

    if (!onboarding) return { error: 'Player not found' }

    const isComplete = !!(
        onboarding.hasSeenWelcome &&
        onboarding.hasCompletedFirstQuest &&
        onboarding.hasCreatedFirstQuest
    )

    // Determine next step
    let nextStep = 'done'
    if (!onboarding.hasSeenWelcome) {
        nextStep = 'welcome'
    } else if (!onboarding.hasCompletedFirstQuest) {
        nextStep = 'complete-quest'
    } else if (!onboarding.hasCreatedFirstQuest) {
        nextStep = 'create-quest'
    }

    return {
        ...onboarding,
        isComplete,
        nextStep
    }
}

/**
 * Mark an onboarding step as complete
 */
export async function completeOnboardingStep(
    step: 'welcome' | 'firstQuest' | 'firstCreate',
    playerId?: string,
    options?: { skipRevalidate?: boolean }
) {
    let player
    if (playerId) {
        player = await db.player.findUnique({ where: { id: playerId } })
    } else {
        player = await getCurrentPlayer()
    }

    if (!player) return { error: 'Not logged in' }

    const updates: any = {}

    switch (step) {
        case 'welcome':
            updates.hasSeenWelcome = true
            break
        case 'firstQuest':
            updates.hasCompletedFirstQuest = true
            break
        case 'firstCreate':
            updates.hasCreatedFirstQuest = true
            break
    }

    // Update player
    await db.player.update({
        where: { id: player.id },
        data: updates
    })

    // Check if onboarding is now complete
    const status = await getOnboardingStatus(player.id)
    if ('isComplete' in status && status.isComplete && !status.onboardingCompletedAt) {
        await db.player.update({
            where: { id: player.id },
            data: { onboardingCompletedAt: new Date() }
        })

        // Grant reward vibeulons
        await db.vibulonEvent.create({
            data: {
                playerId: player.id,
                source: 'onboarding_complete',
                amount: 5,
                notes: 'Completed onboarding!',
                archetypeMove: 'IGNITE'
            }
        })
    }

    if (!options?.skipRevalidate) {
        revalidatePath('/')
    }
    return { success: true, status }
}

/**
 * Update player nation or archetype (playbook)
 */
export async function updatePlayerIdentity(
    type: 'nation' | 'archetype',
    id: string
) {
    try {
        const player = await getCurrentPlayer()
        if (!player) return { error: 'Not logged in' }

        if (type === 'nation') {
            await db.player.update({
                where: { id: player.id },
                data: { nationId: id }
            })
        } else {
            await db.player.update({
                where: { id: player.id },
                data: { playbookId: id }
            })
        }

        // Auto-assign any gated threads that the player now qualifies for
        await assignGatedThreads(player.id)

        revalidatePath('/')
        revalidatePath('/adventures')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to update identity:', error)
        return { error: error.message || 'Failed to update identity' }
    }
}

/**
 * Save both nation and archetype selections at once (Legacy Onboarding Form)
 */
export async function saveOnboardingSelections(
    playerId: string,
    nationId: string,
    playbookId: string
) {
    try {
        const updatedPlayer = await db.player.update({
            where: { id: playerId },
            data: {
                nationId,
                playbookId,
                onboardingComplete: true,
                onboardingCompletedAt: new Date()
            }
        })

        // EXPERT REWARDS & CLEANUP
        if (updatedPlayer.onboardingMode === 'expert') {
            // 1. Grant 5 Vibeulons bonus
            const { mintVibulon } = await import('./economy')
            await mintVibulon(playerId, 5, {
                source: 'onboarding_complete',
                id: 'expert_bonus',
                title: 'Expert Orientation Bonus'
            }, { skipRevalidate: true })
            console.log(`[ExpertMode] Granted 5 vibeulons to ${playerId}`)

            // 2. Mark orientation threads as completed so they don't show up on dashboard
            await db.threadProgress.updateMany({
                where: {
                    playerId,
                    thread: { threadType: 'orientation' }
                },
                data: {
                    completedAt: new Date()
                }
            })
            console.log(`[ExpertMode] Suppressed orientation threads for ${playerId}`)
        }

        // Auto-assign any gated threads
        await assignGatedThreads(playerId)

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to save onboarding selections:', error)
        return { error: error.message || 'Failed to save selections' }
    }
}

/**
 * Create tutorial/welcome quest for new player
 */
export async function createTutorialQuest(playerId: string) {
    try {
        // Check if tutorial quest already exists
        const existing = await db.customBar.findFirst({
            where: {
                creatorId: playerId,
                type: 'tutorial'
            }
        })

        if (existing) {
            return { success: true, questId: existing.id }
        }

        // Create welcome quest
        const tutorialQuest = await db.customBar.create({
            data: {
                creatorId: playerId,
                title: '🎯 Your First Quest: Welcome to BARS',
                description: `Welcome to BARS ENGINE! This is your first quest. 

**What are Vibeulons?** ♦
Vibeulons are the currency of collective energy and contribution. Earn them by completing quests and contributing to the community.

**Your Task:**
Share what brought you here today. What are you excited about for the Feb 21 party?

Complete this quest to earn your first 5 vibeulons and unlock the quest creation tools!`,
                type: 'tutorial',
                reward: 5,
                status: 'active',
                visibility: 'private', // Only visible to creator
                inputs: JSON.stringify([
                    {
                        key: 'introduction',
                        label: 'What brought you here?',
                        type: 'textarea',
                        placeholder: 'Share your story...'
                    }
                ])
            }
        })

        // Auto-assign to player
        await db.playerQuest.create({
            data: {
                playerId: playerId,
                questId: tutorialQuest.id,
                status: 'assigned'
            }
        })

        return { success: true, questId: tutorialQuest.id }

    } catch (error: any) {
        console.error('Failed to create tutorial quest:', error)
        return { error: error.message || 'Failed to create tutorial quest' }
    }
}

/**
 * Get all nations and archetypes (for recommendation UI)
 */
export async function getWorldData() {
    return Promise.all([
        db.nation.findMany({ where: { archived: false }, orderBy: { name: 'asc' } }),
        db.playbook.findMany({ orderBy: { name: 'asc' } })
    ])
}

/**
 * Automatically assign quest threads that are gated by nation or archetype.
 * Usually called when onboarding is complete or identity is updated.
 */
export async function assignGatedThreads(playerIdOverride?: string) {
    const playerId = playerIdOverride || await requirePlayer()

    // Get player details
    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { nationId: true, playbookId: true }
    })

    if (!player) return { error: 'Player not found' }

    // Find matching threads (standard or orientation)
    const matchingThreads = await (db.questThread.findMany as any)({
        where: {
            OR: [
                { gateNationId: player.nationId || '---' },
                { gatePlaybookId: player.playbookId || '---' }
            ],
            status: 'active'
        }
    })

    if (matchingThreads.length === 0) return { success: true, count: 0 }

    let assignedCount = 0
    for (const thread of matchingThreads) {
        // Check if already assigned
        const existing = await db.threadProgress.findFirst({
            where: { threadId: thread.id, playerId }
        })

        if (!existing) {
            await db.threadProgress.create({
                data: {
                    threadId: thread.id,
                    playerId,
                    currentPosition: 1
                }
            })
            assignedCount++
            console.log("[ONBOARDING] Auto-assigned thread " + thread.title + " to player " + playerId)
        }
    }

    if (assignedCount > 0) revalidatePath('/')
    return { success: true, count: assignedCount }
}
