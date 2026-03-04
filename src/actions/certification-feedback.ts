'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * Logs certification quest feedback from any logged-in player.
 * Used when testers report issues during verification quests.
 * Writes to .feedback/cert_feedback.jsonl for agents/developers to triage.
 *
 * FR1 (quest-grammar-cert-feedback): MUST NOT call revalidatePath or router.refresh.
 * Callers (TwineQuestModal, PassageRenderer) use skipRevalidate when on FEEDBACK.
 */
export async function logCertificationFeedback(
    questId: string,
    passageName: string,
    feedback: string
) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const trimmed = feedback?.trim()
    if (!trimmed) return { error: 'Feedback is required' }

    try {
        const feedbackDir = path.join(process.cwd(), '.feedback')
        await fs.mkdir(feedbackDir, { recursive: true })

        const feedbackFile = path.join(feedbackDir, 'cert_feedback.jsonl')
        const entry = {
            timestamp: new Date().toISOString(),
            playerId: player.id,
            playerName: player.name,
            questId,
            passageName,
            feedback: trimmed
        }

        await fs.appendFile(feedbackFile, JSON.stringify(entry) + '\n')
        return { success: true }
    } catch (error) {
        console.error('Failed to log certification feedback:', error)
        return { error: 'Failed to write feedback' }
    }
}
