'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * Resets a completed/graveyard certification quest for an admin
 * so it can be re-run for validation purposes.
 */
export async function restoreCertificationQuest(questId: string) {
    const player = await getCurrentPlayer()
    if (!player) throw new Error('Not logged in')

    const playerWithRoles = await db.player.findUnique({
        where: { id: player.id },
        include: { roles: { include: { role: true } } }
    })
    const isAdmin = !!playerWithRoles?.roles.some(r => r.role.key === 'admin')

    if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required.')
    }

    try {
        // 1. Find the PlayerQuest record
        const playerQuest = await db.playerQuest.findFirst({
            where: {
                playerId: player.id,
                questId: questId,
                status: 'completed'
            }
        })

        if (!playerQuest) {
            return { error: 'No completed quest found for this ID.' }
        }

        // 2. Delete the specific run for this quest to allow a clean restart
        await db.twineRun.deleteMany({
            where: {
                playerId: player.id,
                questId: questId
            }
        })

        // 3. Reset the quest status back to assigned (or delete to allow fresh pickup)
        // For system quests, we usually "pick them up" automatically or they are always available.
        // If it's a PlayerQuest record, we can just delete it so it's "available" again in the market.
        await db.playerQuest.delete({
            where: { id: playerQuest.id }
        })

        revalidatePath('/bars/available')
        revalidatePath('/adventures')
        revalidatePath('/')

        return { success: true }
    } catch (e) {
        console.error('[RESTORE_CERTIFICATION] Failed:', e)
        return { error: 'Failed to restore quest.' }
    }
}
