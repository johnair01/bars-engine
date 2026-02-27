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
 * Dev only: Get all players for the switcher.
 * Returns [] if DB is unavailable (e.g. DATABASE_URL missing) so the page does not crash.
 */
export async function getAllPlayers(): Promise<{ id: string, name: string, contactValue: string | null }[]> {
    if (process.env.NODE_ENV !== 'development') {
        return []
    }

    try {
        return await db.player.findMany({
            select: { id: true, name: true, contactValue: true },
            orderBy: { createdAt: 'desc' }
        })
    } catch (err) {
        // DATABASE_URL missing, DB unreachable, or Prisma init error — don't crash the page
        console.warn('[dev] getAllPlayers failed (DB/env):', (err as Error)?.message)
        return []
    }
}
