'use server'

import { getPassage } from '@/lib/story'
import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { assignBarToPlayer } from './game'
import { db } from '@/lib/db'

export async function submitChoice(formData: FormData) {
    const passageId = formData.get('passageId') as string
    const choiceIndex = parseInt(formData.get('choiceIndex') as string)

    // 1. Validate Session
    const player = await getCurrentPlayer()
    if (!player) return redirect('/conclave')

    // 2. Load Passage
    const passage = await getPassage(passageId)
    if (!passage) return

    // 3. Execute Passage Actions (Locked MVP)
    if (passage.action === 'ASSIGN_BAR') {
        // Stub random assignment or use the existing Logic
        await assignBarToPlayer(player.id)
    }

    if (passage.action === 'ASSIGN_QUEST') {
        // Assign the default quest "The Arrival" (assuming it's the first one seeded)
        const quest = await db.quest.findFirst()

        if (quest) {
            // Check if already assigned
            const existing = await db.playerQuest.findFirst({
                where: {
                    playerId: player.id,
                    questId: quest.id
                }
            })
            if (!existing) {
                await db.playerQuest.create({
                    data: {
                        playerId: player.id,
                        questId: quest.id,
                        status: 'active'
                    }
                })
            }
        }
    }

    // 4. Handle Choice Target
    const choice = passage.choices[choiceIndex]
    if (!choice) return

    if (choice.targetId === 'WALLET_REDIRECT') {
        return redirect('/wallet')
    }

    // 5. Redirect to next passage
    redirect(`/story/${choice.targetId}`)
}
