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
                storyProgress: JSON.stringify({
                    currentNodeId: 'intro_001',
                    completedNodes: [],
                    decisions: [],
                    vibeulonsEarned: 0,
                    startedAt: new Date(),
                    lastActiveAt: new Date()
                })
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

import { getStaticStoryNode } from '@/lib/story-content'

export async function getStoryNode(nodeId: string, playerId?: string): Promise<StoryNode | null> {
    return getStaticStoryNode(nodeId, playerId)
}

export async function recordStoryChoice(
    playerId: string,
    nodeId: string,
    choiceId: string,
    input?: string, // Added optional input
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

        // Handle Identity Name Input
        if (nodeId === 'identity_001' && input) {
            await db.player.update({
                where: { id: playerId },
                data: { name: input } // Removed nameSetAt as it's not in schema
            })
        }

        // Handle Unlocks (Nations/Playbooks)
        if (rewards?.unlocks) {
            // Check for nation unlocks 
            const nationUnlock = rewards.unlocks.find(u => u.startsWith('nation:'))
            if (nationUnlock) {
                const nationId = nationUnlock.split(':')[1]
                await db.player.update({
                    where: { id: playerId },
                    data: { nationId } // Set their nation selection
                })
            }

            // Check for playbook unlocks
            const playbookUnlock = rewards.unlocks.find(u => u.startsWith('playbook:'))
            if (playbookUnlock) {
                const playbookId = playbookUnlock.split(':')[1]
                await db.player.update({
                    where: { id: playerId },
                    data: { playbookId } // Set their playbook selection
                })
            }
        }

        // Parse existing progress
        const currentProgress = player.storyProgress
            ? JSON.parse(player.storyProgress as string) as StoryProgress
            : {
                currentNodeId: 'intro_001',
                completedNodes: [],
                decisions: [],
                vibeulonsEarned: 0,
                startedAt: new Date(),
                lastActiveAt: new Date()
            } as StoryProgress

        const nextNodeId = await getNextNodeId(nodeId, choiceId)

        // Update progress
        const updatedProgress: StoryProgress = {
            ...currentProgress,
            currentNodeId: nextNodeId,
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
                storyProgress: JSON.stringify(updatedProgress)
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Failed to record choice:', error)
        return { success: false, error: 'Failed to save progress' }
    }
}

// Helper to find next node from choice
async function getNextNodeId(currentNodeId: string, choiceId: string): Promise<string> {
    const node = await getStaticStoryNode(currentNodeId)
    if (!node) return currentNodeId; // Fallback
    const choice = node.choices.find(c => c.id === choiceId)
    return choice ? choice.nextNodeId : currentNodeId
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

        const progress = player.storyProgress
            ? JSON.parse(player.storyProgress as string) as StoryProgress
            : { vibeulonsEarned: 0 }

        // Update player with character data
        await db.player.update({
            where: { id: playerId },
            data: {
                nationId,
                playbookId,
                onboardingComplete: true
            }
        })

        // Create vibeulons in wallet - ensure type safety
        const vibeulonCount = progress.vibeulonsEarned || 0
        if (vibeulonCount > 0) {
            await db.vibulon.createMany({
                data: Array.from({ length: vibeulonCount }).map(() => ({
                    ownerId: playerId,
                    sourceType: 'onboarding',
                    sourceId: 'guided_completion',
                    originSource: 'onboarding', // Added required fields
                    originId: 'guided_completion',
                    originTitle: 'Guided Onboarding'
                }))
            })
        }

        // Assign orientation quest thread
        const { assignOrientationThreads } = await import('./quest-thread')
        await assignOrientationThreads(playerId)

        return { success: true }
    } catch (error) {
        console.error('Failed to finalize onboarding:', error)
        return { success: false, error: 'Failed to complete onboarding' }
    }
}
