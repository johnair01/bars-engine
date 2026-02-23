'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Appends admin feedback to a local file for the agent to pull later.
 */
export async function logAdminFeedback(feedback: string, context?: any) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // Ensure admin check
    const adminRole = await db.playerRole.findFirst({
        where: { playerId: player.id, role: { key: 'admin' } }
    })
    if (!adminRole) return { error: 'Admin access required' }

    try {
        const feedbackDir = path.join(process.cwd(), '.feedback')
        await fs.mkdir(feedbackDir, { recursive: true })

        const feedbackFile = path.join(feedbackDir, 'admin_feedback.jsonl')
        const entry = {
            timestamp: new Date().toISOString(),
            adminId: player.id,
            adminName: player.name,
            feedback,
            context
        }

        await fs.appendFile(feedbackFile, JSON.stringify(entry) + '\n')
        return { success: true }
    } catch (error) {
        console.error('Failed to log admin feedback:', error)
        return { error: 'Failed to write to feedback log' }
    }
}
