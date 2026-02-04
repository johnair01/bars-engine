'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitQuestReturn(prevState: any, formData: FormData) {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/invite/ANTIGRAVITY')

    const questId = formData.get('questId') as string
    const returnText = (formData.get('returnText') as string) || '' // Optional

    // Find the active quest (idempotency check: only complete if still active)
    const activeQuest = await db.playerQuest.findFirst({
        where: {
            playerId: player.id,
            questId,
            status: 'active' // Only complete if still active
        }
    })

    // If quest is not found or already completed, just redirect (idempotent)
    if (!activeQuest) {
        revalidatePath('/wallet')
        return redirect('/wallet')
    }

    // Update Quest Status to 'completed'
    await db.playerQuest.update({
        where: { id: activeQuest.id },
        data: {
            status: 'completed',
            returnText: returnText || null, // Store if provided
            completedAt: new Date(),
        }
    })

    // GRANT VIBULON (+1) - Only grants because we confirmed status was 'active'
    // IGNITE = completing a quest (Achiever move, Stage 6: Short-Term Wins)
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

