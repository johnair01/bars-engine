'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * Cast a Playbook Move (Emotional Alchemy)
 * - Verifies player owns the move (via Playbook)
 * - Logs the "Cast" event to Vibeulon history
 * - Does NOT cost Vibeulons (it generates momentary flow)
 */
export async function castAlchemyMove(moveName: string, notes?: string) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    try {
        const player = await db.player.findUnique({
            where: { id: playerId },
            include: { playbook: true }
        })

        if (!player || !player.playbook) {
            return { error: 'No playbook found' }
        }

        // Parse moves from JSON string
        let allowedMoves: string[] = []
        try {
            allowedMoves = JSON.parse(player.playbook.moves)
        } catch (e) {
            console.error("Failed to parse playbook moves", e)
            return { error: 'Invalid playbook data' }
        }

        if (!allowedMoves.includes(moveName)) {
            return { error: `You do not know the move "${moveName}"` }
        }

        // Log the Move Cast
        await db.vibulonEvent.create({
            data: {
                playerId,
                source: 'alchemy_cast',
                amount: 0, // Moves don't cost or mint directly, they create flow
                notes: notes || `Cast ${moveName}`,
                archetypeMove: moveName,
                // We could link this to a quest if passed in referencing `questId`
            }
        })

        revalidatePath('/')
        return { success: true, message: `Cast ${moveName}!` }

    } catch (e: any) {
        console.error("Alchemy cast failed:", e?.message)
        return { error: 'Failed to cast move' }
    }
}
