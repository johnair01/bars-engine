'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { completeQuestForPlayer } from '@/actions/quest-engine'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitQuestReturn(prevState: any, formData: FormData) {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/conclave')

    const questId = formData.get('questId') as string

    // Collect all inputs from the quest's schema
    const responses: Record<string, string> = {}
    formData.forEach((value, key) => {
        if (key !== 'questId' && key !== 'prev_action_state') {
            responses[key] = value as string
        }
    })

    // DELEGATE TO QUEST ENGINE
    // This handles rewards, onboarding, thread advancement, etc.
    try {
        await completeQuestForPlayer(player.id, questId, responses)
    } catch (e) {
        console.error("[submitQuestReturn] Failed to complete quest via engine:", e)
        return { error: e instanceof Error ? e.message : 'Failed to complete quest' }
    }

    revalidatePath('/wallet')
    redirect('/wallet')
}

