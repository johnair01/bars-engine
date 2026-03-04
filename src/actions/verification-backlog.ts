'use server'

import { db } from '@/lib/db'

/**
 * Records a verification quest completion for backlog sync.
 * Called from autoCompleteQuestFromTwine when a cert quest has backlogPromptPath.
 * No auth check—completion is already validated by the caller.
 */
export async function recordVerificationCompletion(
    questId: string,
    playerId: string,
    backlogPromptPath: string
) {
    await db.verificationCompletionLog.create({
        data: {
            questId,
            playerId,
            backlogPromptPath,
        },
    })
}
