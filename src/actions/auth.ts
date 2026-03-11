'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'

export async function getCurrentPlayerId(): Promise<{ playerId: string } | null> {
    const player = await getCurrentPlayer()
    return player ? { playerId: player.id } : null
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('bars_player_id')
    redirect('/login')
}
