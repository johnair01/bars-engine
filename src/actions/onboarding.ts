'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Get onboarding status for current player
 */
export async function getOnboardingStatus() {
    const player = await getCurrentPlayer()
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
export async function completeOnboardingStep(step: 'welcome' | 'firstQuest' | 'firstCreate') {
    const player = await getCurrentPlayer()
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
    const status = await getOnboardingStatus()
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

    revalidatePath('/')
    return { success: true, status }
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
