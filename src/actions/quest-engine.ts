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

    try {
        // CASE A: Quest inside a Pack
        if (context?.packId) {
            const result = await completePackQuest(context.packId, questId)
            if (result.error) throw new Error(result.error)

            // Optionally logs specific event if needed, but completePackQuest handles basic progress
            return { success: true, ...result }
        }

        // CASE B: Standard / Standalone Quest
        const activeQuest = await db.playerQuest.findFirst({
            where: {
                playerId: player.id,
                questId,
                status: 'assigned'
            }
        })

        if (!activeQuest) {
            // Check if it's a public quest we can claim-and-complete instantly? 
            // For now, let's assume you must have it assigned.
            return { error: 'Quest not assigned or already completed' }
        }

        // Complete it
        await db.playerQuest.update({
            where: { id: activeQuest.id },
            data: {
                status: 'completed',
                inputs: JSON.stringify(inputs),
                completedAt: new Date(),
            }
        })

        // Log completion reward
        await db.vibulonEvent.create({
            data: {
                playerId: player.id,
                source: 'quest_complete',
                amount: 1, // Standard reward
                notes: `Completed quest: ${questId}`,
                archetypeMove: 'Arete' // Virtue/Excellence
            }
        })

        revalidatePath('/')
        return { success: true }

    } catch (e: any) {
        console.error("Complete quest failed:", e)
        return { error: e.message || 'Failed to complete quest' }
    }
}
