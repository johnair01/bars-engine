'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * Dev only: Switch current user cookie
 */
export async function switchIdentity(targetPlayerId: string) {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Dev mode only')
    }

    const cookieStore = await cookies()
    cookieStore.set('bars_player_id', targetPlayerId)

    revalidatePath('/')
    return { success: true }
}

/**
 * Dev only: Get all players for the switcher
 */
export async function getAllPlayers() {
    if (process.env.NODE_ENV !== 'development') {
        return []
    }

    return db.player.findMany({
        select: { id: true, name: true, contactValue: true },
        orderBy: { createdAt: 'desc' }
    })
}
