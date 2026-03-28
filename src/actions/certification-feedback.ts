'use server'

import { getCurrentPlayer } from '@/lib/auth'
import { persistPlayerFeedbackToBacklog } from '@/lib/feedback/persist-player-feedback-to-backlog'

/**
 * Logs certification quest feedback from any logged-in player.
 * Persists to `BacklogItem` (durable) and best-effort `.feedback/cert_feedback.jsonl`.
 *
 * @deprecated Prefer POST /api/feedback/cert (API-first, no server action revalidation).
 * TwineQuestModal and PassageRenderer now use fetch() to avoid kick-to-dashboard.
 * Kept for backward compatibility if other callers exist.
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

    const persisted = await persistPlayerFeedbackToBacklog({
        source: 'certification',
        playerId: player.id,
        playerName: player.name,
        questId,
        passageName,
        feedback: trimmed,
    })

    if ('error' in persisted) {
        console.error('Failed to log certification feedback:', persisted.error)
        return { error: 'Failed to save feedback' }
    }

    return { success: true, backlogItemId: persisted.backlogItemId }
}
