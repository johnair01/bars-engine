'use server'

import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { getActiveRuntimeModifierInputsForQuest } from '@/lib/quest-modifiers'

export async function getRuntimeQuestModifiers(questId: string) {
    const player = await getCurrentPlayer()
    if (!player) {
        return { success: false, error: 'Not logged in' as const }
    }

    const assignment = await db.playerQuest.findFirst({
        where: {
            playerId: player.id,
            questId,
        },
        select: { id: true }
    })
    if (!assignment) {
        return { success: false, error: 'Quest is not assigned to this player' as const }
    }

    const inputs = await getActiveRuntimeModifierInputsForQuest(questId)
    return {
        success: true as const,
        inputs,
        activeModifierCount: inputs.length,
    }
}
