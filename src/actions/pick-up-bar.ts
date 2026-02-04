'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { STARTER_BARS } from '@/lib/bars'

export async function pickUpBar(formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const barId = formData.get('barId') as string

    // 1. Look up CustomBar in DB
    const customBar = await db.customBar.findUnique({
        where: { id: barId }
    })

    if (!customBar) {
        return { error: 'Unknown bar' }
    }

    if (customBar.status !== 'active') {
        return { error: 'Quest is not active.' }
    }

    // 2. Validate Access / Claiming
    // Check if already claimed by another player (for unique quests)
    if (customBar.claimedById && customBar.claimedById !== playerId) {
        return { error: 'This quest has already been claimed by another player.' }
    }

    // Private bars logic
    if (customBar.visibility === 'private' && customBar.creatorId !== playerId && !customBar.claimedById) {
        return { error: 'Private quests cannot be picked up directly.' }
    }

    // Claim the bar if not already claimed AND not a system quest
    if (!customBar.claimedById && !customBar.isSystem) {
        await db.customBar.update({
            where: { id: barId },
            data: { claimedById: playerId }
        })
    }

    // 3. Create PlayerQuest (Assignment)
    try {
        const existingQuest = await db.playerQuest.findUnique({
            where: {
                playerId_questId: {
                    playerId,
                    questId: barId
                }
            }
        })

        if (existingQuest) {
            if (existingQuest.status === 'completed') {
                return { error: 'Bar already completed' }
            }
            if (existingQuest.status === 'assigned') {
                return { error: 'Bar already active' }
            }
            // If failed, we might allow retry? assuming assigned for now if extracting logic implies retry
        }

        // Create assignment
        await db.playerQuest.create({
            data: {
                playerId,
                questId: barId,
                status: 'assigned'
            }
        })

        revalidatePath('/')
        return { success: true, barId }

    } catch (e: any) {
        console.error("Pick up bar failed:", e?.message)
        return { error: 'Failed to pick up bar' }
    }
}
