'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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
        const wallet = await db.vibulon.findMany({
            where: { ownerId: playerId },
            orderBy: { createdAt: 'asc' },
            take: RELEASE_COST
        })

        if (wallet.length < RELEASE_COST) {
            return { error: `Need ${RELEASE_COST} vibeulons to release` }
        }

        const tokenIds = wallet.map(t => t.id)

        // Transaction: Burn tokens, update bar
        await db.$transaction([
            // Burn tokens (expenditure)
            db.vibulon.deleteMany({
                where: { id: { in: tokenIds } }
            }),
            // Log expense
            db.vibulonEvent.create({
                data: {
                    playerId,
                    source: 'quest_release',
                    amount: -RELEASE_COST,
                    notes: `Released quest: ${bar.title}`,
                    archetypeMove: 'CLEANSE' // Or another appropriate move
                }
            }),
            // Update Bar
            db.customBar.update({
                where: { id: barId },
                data: {
                    claimedById: null,
                    visibility: 'public',
                }
            })
        ])

        revalidatePath('/')
        return { success: true }

    } catch (e: any) {
        console.error("Release bar failed:", e?.message)
        return { error: 'Failed to release quest' }
    }
}
