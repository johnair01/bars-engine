'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { completePackQuest } from '@/actions/quest-pack'
import { advanceThread } from '@/actions/quest-thread'
import { getOnboardingStatus, completeOnboardingStep } from '@/actions/onboarding'
import { revalidatePath } from 'next/cache'

/**
 * Checks the status of a specific quest for the current player.
 * Useful for the modal to know if it's already done.
 */
export async function checkQuestStatus(questId: string, context?: { packId?: string, threadId?: string }) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // 1. Check if it's in a Pack
    if (context?.packId) {
        const progress = await db.packProgress.findUnique({
            where: { packId_playerId: { packId: context.packId, playerId: player.id } }
        })
        if (progress) {
            const completed = JSON.parse(progress.completed) as string[]
            return {
                status: completed.includes(questId) ? 'completed' : 'active',
                completedAt: progress.completedAt
            }
        }
    }

    // 2. Check standalone assignment (PlayerQuest)
    const assignment = await db.playerQuest.findFirst({
        where: {
            playerId: player.id,
            questId: questId
        }
    })

    if (assignment) {
        return {
            status: assignment.status,
            completedAt: assignment.completedAt
        }
    }

    return { status: 'available' }
}

/**
 * Complete a quest.
 * Handles both Pack context and Standalone context.
 */
export async function completeQuest(questId: string, inputs: any, context?: { packId?: string, threadId?: string }) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    if (!player) throw new Error('No active player')

    // Fetch the quest to check for Story Clock bonuses
    const quest = await db.customBar.findUnique({
        where: { id: questId }
    })

    if (!quest) throw new Error('Quest not found')

    // CHECK FOR STORY CLOCK BONUS
    let bonusMultiplier = 1
    let isFirstCompleter = false

    if (quest.hexagramId && quest.periodGenerated) {
        const globalState = await db.globalState.findUnique({ where: { id: 'singleton' } })

        // Old period bonus
        if (globalState && quest.periodGenerated < globalState.currentPeriod) {
            bonusMultiplier = 1.5 // +50% bonus
        }

        // Check if this is the first completer
        if (!quest.firstCompleterId) {
            isFirstCompleter = true
            // Update quest with first completer
            await db.customBar.update({
                where: { id: questId },
                data: { firstCompleterId: player.id }
            })
        }
    }

    // MARK QUEST AS COMPLETE
    // MARK QUEST AS COMPLETE
    await db.playerQuest.upsert({
        where: {
            playerId_questId: {
                playerId: player.id,
                questId
            }
        },
        update: {
            status: 'completed',
            inputs: JSON.stringify(inputs),
            completedAt: new Date(),
        },
        create: {
            playerId: player.id,
            questId,
            status: 'completed',
            inputs: JSON.stringify(inputs),
            completedAt: new Date(),
            assignedAt: new Date()
        }
    })

    // GRANT VIBEULONS with bonus
    const baseReward = quest.reward || 1
    const finalReward = Math.floor(baseReward * bonusMultiplier)

    await db.vibulonEvent.create({
        data: {
            playerId: player.id,
            source: 'quest',
            amount: finalReward,
            notes: `Quest Completed: ${quest.title}${bonusMultiplier > 1 ? ' (+50% period bonus!)' : ''}${isFirstCompleter ? ' (FIRST!)' : ''}`,
            archetypeMove: 'IGNITE',
            questId: questId,
        }
    })

    // Handle Pack/Thread progression
    if (context?.packId) {
        await completePackQuest(context.packId, questId) // Assuming completePackQuest handles progression
    }

    if (context?.threadId) {
        await advanceThread(context.threadId, questId)
    }

    // CHECK ONBOARDING STATUS
    const obStatus = await getOnboardingStatus(player.id)
    if (!('error' in obStatus) && !obStatus.hasCompletedFirstQuest) {
        await completeOnboardingStep('firstQuest', player.id)
    }

    revalidatePath('/')
    revalidatePath('/story-clock')
    revalidatePath('/wallet')
    return { success: true, reward: finalReward, isFirstCompleter, bonusApplied: bonusMultiplier > 1 }
}
/**
 * Fire a trigger to auto-complete matching quests.
 */
export async function fireTrigger(trigger: string) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // 1. Find all active PlayerQuests for this player
    const activeAssignments = await db.playerQuest.findMany({
        where: {
            playerId: player.id,
            status: 'assigned'
        },
        include: {
            quest: true
        }
    })

    // 2. Also find quests in active Threads
    const activeThreads = await db.threadProgress.findMany({
        where: {
            playerId: player.id,
            completedAt: null
        },
        include: {
            thread: {
                include: {
                    quests: {
                        include: {
                            quest: true
                        }
                    }
                }
            }
        }
    })

    const candidates: { questId: string, threadId?: string }[] = []

    // Collect candidates from standalone assignments
    for (const assignment of activeAssignments) {
        const inputs = JSON.parse(assignment.quest.inputs || '[]') as any[]
        if (inputs.some(input => input.trigger === trigger)) {
            candidates.push({ questId: assignment.questId })
        }
    }

    // Collect candidates from threads (only the CURRENT quest in the thread)
    for (const progress of activeThreads) {
        const currentQuestEntry = progress.thread.quests.find(q => q.position === progress.currentPosition + 1)
        if (currentQuestEntry) {
            const inputs = JSON.parse(currentQuestEntry.quest.inputs || '[]') as any[]
            if (inputs.some(input => input.trigger === trigger)) {
                candidates.push({
                    questId: currentQuestEntry.questId,
                    threadId: progress.threadId
                })
            }
        }
    }

    if (candidates.length === 0) return { success: false, message: 'No matching quests found for trigger' }

    // 3. Complete them
    const results = []
    for (const candidate of candidates) {
        const result = await completeQuest(candidate.questId, { autoTriggered: true, trigger }, { threadId: candidate.threadId })
        results.push(result)
    }

    return { success: true, results }
}
