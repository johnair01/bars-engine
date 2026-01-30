import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const getCurrentPlayer = cache(async () => {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) return null

    try {
        const player = await db.player.findUnique({
            where: { id: playerId },
            include: {
                roles: { include: { role: true } },
                bars: { include: { bar: true } },
                _count: { select: { vibulonEvents: true } }
            }
        })
        return player
    } catch (e) {
        return null
    }
})
