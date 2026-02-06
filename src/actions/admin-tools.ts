'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function ensureAdmin() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) throw new Error('Not authenticated')

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    const isAdmin = player?.roles.some(r => r.role.key === 'admin')
    if (!isAdmin) throw new Error('Not authorized: Admin role required')

    return player
}

/**
 * Admin only: Switch current user cookie in production
 */
export async function switchIdentityAdminPulse(targetPlayerId: string) {
    await ensureAdmin()

    const cookieStore = await cookies()
    cookieStore.set('bars_player_id', targetPlayerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    })

    revalidatePath('/')
    return { success: true }
}

/**
 * Admin only: Get all players for the switcher
 */
export async function getAllPlayersAdminPulse() {
    try {
        await ensureAdmin()
    } catch (e) {
        return []
    }

    return db.player.findMany({
        select: { id: true, name: true, contactValue: true },
        orderBy: { createdAt: 'desc' }
    })
}
