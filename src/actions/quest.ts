'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
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

    // Find the active quest
    const activeQuest = await db.playerQuest.findFirst({
        where: {
            playerId: player.id,
            questId,
            status: 'assigned'
        }
    })

    if (!activeQuest) {
        revalidatePath('/wallet')
        return redirect('/wallet')
    }

    // Update Quest Status to 'completed'
    await db.playerQuest.update({
        where: { id: activeQuest.id },
        data: {
            status: 'completed',
            inputs: JSON.stringify(responses), // Store dynamic responses
            completedAt: new Date(),
        }
    })

    // GRANT VIBULON (+1)
    await db.vibulonEvent.create({
        data: {
            playerId: player.id,
            source: 'quest',
            amount: 1,
            notes: `Quest Returned: ${questId}`,
            archetypeMove: 'IGNITE',
            questId: questId,
        }
    })

    revalidatePath('/wallet')
    redirect('/wallet')
}

