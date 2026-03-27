import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const getCurrentPlayer = cache(async () => {
    const cookieStore = await cookies()
    let playerId = cookieStore.get('bars_player_id')?.value

    // DEV BYPASS: Allow testing auth-protected pages
    // Set DEV_PLAYER_ID in .env to auto-authenticate in development
    if (!playerId && process.env.NODE_ENV === 'development' && process.env.DEV_PLAYER_ID) {
        playerId = process.env.DEV_PLAYER_ID
    }

    if (!playerId) return null

    try {
        const player = await db.player.findUnique({
            where: { id: playerId },
            include: {
                roles: { include: { role: true } },
                bars: { include: { bar: true } },
                nation: true,
                archetype: true,
                _count: { select: { vibulonEvents: true } }
            }
        })
        return player
    } catch {
        return null
    }
})

export async function requirePlayer() {
    const player = await getCurrentPlayer()
    if (!player) throw new Error('Authentication required')
    return player.id
}

/** Player has invite + completed orientation; can access game world. */
export function isGameAccountReady(player: { inviteId: string; onboardingComplete: boolean } | null): boolean {
    return !!player && !!player.inviteId && player.onboardingComplete === true
}
