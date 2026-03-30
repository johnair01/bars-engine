'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * 1. Publish a story run for collaboration.
 * Marks the run as shared so others can see it and "Yes-And" it.
 */
export async function publishStoryForCollaboration(runId: string) {
    try {
        const player = await getCurrentPlayer()
        if (!player) throw new Error('Unauthorized')

        const run = await db.twineRun.update({
            where: { id: runId, playerId: player.id },
            data: { isCollaborative: true },
        })

        revalidatePath(`/adventures/${run.storyId}/play`)
        return { success: true, runId: run.id }
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to publish' }
    }
}

/**
 * 2. Bridge a "Yes-And" branch with a BAR.
 * Creates a new collaborative fork of an existing run.
 */
export async function bridgeBranchWithBar(params: {
    parentRunId: string
    nodeId: string
    barId: string
}) {
    const { parentRunId, nodeId, barId } = params

    try {
        const player = await getCurrentPlayer()
        if (!player) throw new Error('Unauthorized')

        const parentRun = await db.twineRun.findUnique({
            where: { id: parentRunId },
            include: { story: true }
        })
        if (!parentRun) throw new Error('Parent run not found')

        // Create a new collaborative run (fork) for the current player
        const newRun = await db.twineRun.create({
            data: {
                storyId: parentRun.storyId,
                playerId: player.id,
                questId: parentRun.questId,
                parentRunId: parentRun.id,
                isCollaborative: true,
                currentPassageId: parentRun.currentPassageId,
                visited: parentRun.visited,
                cyoaState: parentRun.cyoaState,
                agentMetadata: JSON.stringify({
                    forkedFromNodeId: nodeId,
                    seedBarId: barId,
                    contributors: [
                        { playerId: player.id, nodeId, barId, timestamp: new Date().toISOString() }
                    ]
                })
            }
        })

        revalidatePath(`/adventures/${parentRun.storyId}/play`)
        return { success: true, runId: newRun.id }
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Failed to bridge' }
    }
}
