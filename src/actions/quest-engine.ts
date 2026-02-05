'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { completePackQuest } from '@/actions/quest-pack'
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
    const existingAssignment = await db.playerQuest.findFirst({
        where: { playerId: player.id, questId, status: 'assigned' }
    })

    if (existingAssignment) {
        await db.playerQuest.update({
            where: { id: existingAssignment.id },
            data: {
                status: 'completed',
                inputs: JSON.stringify(inputs),
                completedAt: new Date(),
            }
        })
    } else {
        // Create new completed assignment
        await db.playerQuest.create({
            data: {
                playerId: player.id,
                questId,
                status: 'completed',
                inputs: JSON.stringify(inputs),
                completedAt: new Date(),
            }
        })
    }

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

    // if (context?.threadId) {
    //     await handleThreadProgression(player.id, context.threadId) // Placeholder for future thread progression
    // }

    revalidatePath('/')
    revalidatePath('/story-clock')
    revalidatePath('/wallet')
    return { success: true, reward: finalReward, isFirstCompleter, bonusApplied: bonusMultiplier > 1 }
}
