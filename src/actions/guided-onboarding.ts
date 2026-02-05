'use server'

import { db } from '@/lib/db'
import { StoryNode, StoryProgress } from '../app/conclave/guided/types'

export async function startGuidedOnboarding(email: string, password: string, inviteToken: string) {
    try {
        // Create player account with guided mode
        const player = await db.player.create({
            data: {
                contactType: 'email',
                contactValue: email,
                passwordHash: password, // TODO: Hash password properly
                name: '', // Will be set during story
                inviteId: inviteToken,
                onboardingMode: 'guided',
                onboardingComplete: false,
                storyProgress: {
                    currentNodeId: 'intro_001',
                    completedNodes: [],
                    decisions: [],
                    vibeulonsEarned: 0,
                    startedAt: new Date(),
                    lastActiveAt: new Date()
                }
            }
        })

        return {
            success: true,
            playerId: player.id,
            nextNodeId: 'intro_001'
        }
    } catch (error) {
        console.error('Failed to start guided onboarding:', error)
        return {
            success: false,
            error: 'Failed to create account'
        }
    }
}

export async function getStoryNode(nodeId: string): Promise<StoryNode | null> {
    // TODO: Fetch from database or story-content.ts
    // For now, returning null as placeholder
    return null
}

export async function recordStoryChoice(
    playerId: string,
    nodeId: string,
    choiceId: string,
    rewards?: {
        vibeulons?: number
        unlocks?: string[]
    }
) {
    try {
        const player = await db.player.findUnique({
            where: { id: playerId }
        })

        if (!player) {
            return { success: false, error: 'Player not found' }
        }

        const currentProgress = player.storyProgress as StoryProgress

        // Update progress
        const updatedProgress: StoryProgress = {
            ...currentProgress,
            completedNodes: [...currentProgress.completedNodes, nodeId],
            decisions: [
                ...currentProgress.decisions,
                {
                    nodeId,
                    choiceId,
                    timestamp: new Date()
                }
            ],
            vibeulonsEarned: currentProgress.vibeulonsEarned + (rewards?.vibeulons || 0),
            lastActiveAt: new Date()
        }

        await db.player.update({
            where: { id: playerId },
            data: {
                storyProgress: updatedProgress
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Failed to record choice:', error)
        return { success: false, error: 'Failed to save progress' }
    }
}

export async function finalizeOnboarding(
    playerId: string,
    nationId: string,
    playbookId: string
) {
    try {
        const player = await db.player.findUnique({
            where: { id: playerId }
        })

        if (!player) {
            return { success: false, error: 'Player not found' }
        }

        const progress = player.storyProgress as StoryProgress

        // Update player with character data
        await db.player.update({
            where: { id: playerId },
            data: {
                nationId,
                playbookId,
                onboardingComplete: true
            }
        })

        // Create vibeulons in wallet
        await db.vibulon.createMany({
            data: Array.from({ length: progress.vibeulonsEarned }).map(() => ({
                playerId,
                sourceType: 'onboarding',
                sourceId: 'guided_completion'
            }))
        })

        // TODO: Assign orientation quest thread

        return { success: true }
    } catch (error) {
        console.error('Failed to finalize onboarding:', error)
        return { success: false, error: 'Failed to complete onboarding' }
    }
}
