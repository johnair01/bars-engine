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
            include: { playbook: true, nation: true }
        })

        if (!player || !player.playbook) {
            return { error: 'No playbook found' }
        }

        // 1. Check Playbook Moves
        let allowedMoves: string[] = []
        try {
            allowedMoves = JSON.parse(player.playbook.moves)
        } catch (e) {
            console.error("Failed to parse playbook moves", e)
        }

        // 2. Check Elemental Affinity Moves
        const { ELEMENTAL_MOVES, hasAffinity } = await import('@/lib/elemental-moves')
        const elementalMove = ELEMENTAL_MOVES[moveName]
        const hasElementalAffinity = elementalMove && player.nation && hasAffinity(player.nation.name, elementalMove.affinity)

        if (!allowedMoves.includes(moveName) && !hasElementalAffinity) {
            return { error: `You do not know the move "${moveName}" or lack the affinity to cast it.` }
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
