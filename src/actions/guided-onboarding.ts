'use server'

/**
 * @deprecated This module implements story-JSON-based onboarding with StoryNode/StoryProgress.
 * The new system uses QuestThread (threadType: 'orientation') with completionEffects
 * to handle onboarding as an editable quest thread.
 * See: quest-engine.ts processCompletionEffects() and seed-onboarding-thread.ts.
 * These functions remain for backward compatibility — new code should use the thread system.
 */

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
    if (playerId && nodeId === 'intro_001') {
        const player = await db.player.findUnique({ where: { id: playerId }, select: { storyProgress: true } })
        const progress = player?.storyProgress ? JSON.parse(player.storyProgress as string) as StoryProgress : null
        const pickedMode = progress?.decisions?.some(d => d.nodeId === 'mode_select')
        if (!pickedMode) {
            return {
                id: 'mode_select',
                nodeId: 'mode_select',
                title: 'Choose Your Onboarding Mode',
                category: 'intro',
                content: `Pick how guided you want this orientation to be. You can continue in full guided mode or jump into a faster expert flow.`,
                guideDialogue: 'How would you like to proceed?',
                choices: [
                    { id: 'mode_guided', text: 'Guided mode (full orientation)', nextNodeId: 'intro_001' },
                    { id: 'mode_expert', text: 'Expert mode (condensed)', nextNodeId: 'identity_001' }
                ]
            }
        }
    }
    return getStaticStoryNode(nodeId, playerId)
}

export async function getOrientationHandbookEntry(kind: 'nation' | 'playbook', id: string) {
    try {
        if (kind === 'nation') {
            const entry = await db.nation.findUnique({
                where: { id },
                select: { id: true, name: true, description: true, imgUrl: true, wakeUp: true, cleanUp: true, growUp: true, showUp: true }
            })
            if (!entry) return { error: 'Nation not found' }
            return { success: true, entry }
        }

        const entry = await db.playbook.findUnique({
            where: { id },
            select: { id: true, name: true, description: true, wakeUp: true, cleanUp: true, growUp: true, showUp: true, content: true }
        })
        if (!entry) return { error: 'Archetype not found' }
        return { success: true, entry }
    } catch {
        return { error: 'Failed to load handbook entry' }
    }
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

        // Persist mode selection immediately after email entry.
        if (nodeId === 'mode_select') {
            await db.player.update({
                where: { id: playerId },
                data: { onboardingMode: choiceId === 'mode_expert' ? 'expert' : 'guided' }
            })
        }

        // Handle Unlocks (Nations/Playbooks)
        let selectedNationId: string | null = null
        let selectedPlaybookId: string | null = null
        if (rewards?.unlocks) {
            // Check for nation unlocks 
            const nationUnlock = rewards.unlocks.find(u => u.startsWith('nation:'))
            if (nationUnlock) {
                const nationId = nationUnlock.split(':')[1]
                selectedNationId = nationId
                await db.player.update({
                    where: { id: playerId },
                    data: { nationId } // Set their nation selection
                })
            }

            // Check for playbook unlocks
            const playbookUnlock = rewards.unlocks.find(u => u.startsWith('playbook:'))
            if (playbookUnlock) {
                const playbookId = playbookUnlock.split(':')[1]
                selectedPlaybookId = playbookId
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
        const resolvedNationId = selectedNationId || player.nationId
        const resolvedPlaybookId = selectedPlaybookId || player.playbookId

        if (nextNodeId === 'playbook_select' && !resolvedNationId) {
            return { success: false, error: 'Please select a nation before continuing.' }
        }
        if ((nextNodeId === 'conclusion' || nextNodeId === 'dashboard') && !resolvedPlaybookId) {
            return { success: false, error: 'Please select an archetype before continuing.' }
        }
        if (nextNodeId === 'dashboard' && (!resolvedNationId || !resolvedPlaybookId)) {
            return { success: false, error: 'Nation and archetype are required to finish onboarding.' }
        }

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
                storyProgress: JSON.stringify(updatedProgress),
                onboardingComplete: nextNodeId === 'dashboard' ? true : undefined
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
    if (currentNodeId === 'mode_select') {
        return choiceId === 'mode_expert' ? 'identity_001' : 'intro_001'
    }
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

export async function resetOnboarding(playerId: string) {
    try {
        await db.player.update({
            where: { id: playerId },
            data: {
                nationId: null,
                playbookId: null,
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
        return { success: true }
    } catch (error) {
        console.error('Failed to reset onboarding:', error)
        return { success: false, error: 'Failed to reset progress' }
    }
}
