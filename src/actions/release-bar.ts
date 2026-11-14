'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { releaseStaleStakes, spendableWhere } from '@/lib/economy/bar-mint'
import { markCoins } from '@/lib/economy/coin-marks'

const RELEASE_COST = 1 // Cost to release back to the salad bowl

export async function releaseBarToSaladBowl(barId: string) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    try {
        const bar = await db.customBar.findUnique({
            where: { id: barId },
            include: { claimedBy: true }
        })

        if (!bar) {
            return { error: 'Quest not found' }
        }

        if (bar.claimedById !== playerId) {
            return { error: 'You do not own this quest' }
        }

        const player = await db.player.findUnique({
            where: { id: playerId }
        })

        // Check wallet balance
        await releaseStaleStakes(db, playerId)
        const wallet = await db.vibulon.findMany({
            where: spendableWhere(playerId),
            orderBy: { createdAt: 'asc' },
            take: RELEASE_COST
        })

        if (wallet.length < RELEASE_COST) {
            return { error: `Need ${RELEASE_COST} vibeulons to release` }
        }

        const tokenIds = wallet.map(t => t.id)

        // Transaction: Burn tokens, update bar
        await db.$transaction(async (tx) => {
            // Mark first: the mark copies the coin row, which the delete removes
            await markCoins(tx, wallet, 'spent', { playerId, place: 'quest-release', barId, note: 'releasing a quest' })
            // Burn tokens (expenditure)
            await tx.vibulon.deleteMany({
                where: { id: { in: tokenIds } }
            })
            // Log expense
            await tx.vibulonEvent.create({
                data: {
                    playerId,
                    source: 'quest_release',
                    amount: -RELEASE_COST,
                    notes: `Released quest: ${bar.title}`,
                    archetypeMove: 'CLEANSE' // Or another appropriate move
                }
            })
            // Update Bar
            await tx.customBar.update({
                where: { id: barId },
                data: {
                    claimedById: null,
                    visibility: 'public',
                }
            })
        })

        revalidatePath('/')
        return { success: true }

    } catch (e: any) {
        console.error("Release bar failed:", e?.message)
        return { error: 'Failed to release quest' }
    }
}
