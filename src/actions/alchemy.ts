'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { AlchemyAltitude, EmotionChannel } from '@/lib/alchemy/types'

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
            include: { archetype: true, nation: true }
        })

        if (!player || !player.archetype) {
            return { error: 'No playbook found' }
        }

        // 1. Check Playbook Moves
        let allowedMoves: string[] = []
        try {
            allowedMoves = JSON.parse(player.archetype.moves)
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

// ---------------------------------------------------------------------------
// AES-1: Alchemy Player State — read / write / advance
// ---------------------------------------------------------------------------

const ALTITUDE_ORDER: AlchemyAltitude[] = ['dissatisfied', 'neutral', 'satisfied']

export async function getPlayerAlchemyState(playerId: string) {
    return db.alchemyPlayerState.findUnique({
        where: { playerId },
        select: { channel: true, altitude: true, updatedAt: true },
    })
}

export async function setPlayerAlchemyState(
    playerId: string,
    channel: EmotionChannel,
    altitude: AlchemyAltitude,
) {
    return db.alchemyPlayerState.upsert({
        where: { playerId },
        create: { playerId, channel, altitude },
        update: { channel, altitude },
    })
}

/** Today's date in YYYY-MM-DD (UTC). */
function todayString(): string {
    return new Date().toISOString().slice(0, 10)
}

export async function getTodayCheckIn(playerId: string) {
    return db.alchemyCheckIn.findUnique({
        where: { playerId_date: { playerId, date: todayString() } },
    })
}

/**
 * Creates a daily check-in record, sets alchemy state, and returns the check-in.
 * Idempotent: returns existing record if already created today.
 */
export async function createDailyCheckIn(
    playerId: string,
    stucknessRating: number,
    channel: EmotionChannel,
    altitude: AlchemyAltitude,
    sceneTypeChosen: string,
) {
    const date = todayString()
    const existing = await db.alchemyCheckIn.findUnique({
        where: { playerId_date: { playerId, date } },
    })
    if (existing) return existing

    // Update alchemy state to match check-in
    await db.alchemyPlayerState.upsert({
        where: { playerId },
        create: { playerId, channel, altitude },
        update: { channel, altitude },
    })

    return db.alchemyCheckIn.create({
        data: { playerId, date, stucknessRating, channel, altitude, sceneTypeChosen },
    })
}

/** Link a scene to today's check-in once it's launched. */
export async function linkCheckInScene(playerId: string, sceneId: string) {
    const date = todayString()
    await db.alchemyCheckIn.updateMany({
        where: { playerId, date },
        data: { sceneId },
    })
}

export async function advancePlayerAltitude(playerId: string) {
    const current = await db.alchemyPlayerState.findUnique({ where: { playerId } })
    if (!current) return { error: 'No alchemy state found for player' }

    const idx = ALTITUDE_ORDER.indexOf(current.altitude as AlchemyAltitude)
    if (idx === -1 || idx >= ALTITUDE_ORDER.length - 1) {
        return { altitude: current.altitude, advanced: false }
    }

    const next = ALTITUDE_ORDER[idx + 1]
    const updated = await db.alchemyPlayerState.update({
        where: { playerId },
        data: { altitude: next },
    })
    return { altitude: updated.altitude, advanced: true }
}
