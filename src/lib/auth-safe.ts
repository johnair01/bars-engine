import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { cache } from 'react'

export interface SafePlayerResult {
    playerId: string | null
    player: any | null
    isAdmin: boolean
    dbError: boolean
    errorMessage?: string
}

/**
 * Centered helper to safely fetch the current player.
 * Distinguishes between "not logged in" and "database unreachable".
 * 
 * NEVER throws; even on critical DB failure, it returns a usable object.
 */
export const getCurrentPlayerSafe = cache(async (options: { includeRoles?: boolean } = {}): Promise<SafePlayerResult> => {
    let playerId: string | null = null

    try {
        const cookieStore = await cookies()
        playerId = cookieStore.get('bars_player_id')?.value || null

        // DEV BYPASS: Allow testing auth-protected pages
        if (!playerId && process.env.NODE_ENV === 'development' && process.env.DEV_PLAYER_ID) {
            playerId = process.env.DEV_PLAYER_ID
        }

        if (!playerId) {
            return { playerId: null, player: null, isAdmin: false, dbError: false }
        }

        const player = await db.player.findUnique({
            where: { id: playerId },
            include: options.includeRoles ? { roles: { include: { role: true } } } : undefined
        })

        const isAdmin = !!(player as any)?.roles?.some((r: any) => r.role.key === 'admin')

        return {
            playerId,
            player,
            isAdmin,
            dbError: false
        }
    } catch (err: any) {
        const isConnError =
            err.name === 'PrismaClientInitializationError' ||
            err.message?.includes('Can\'t reach database server') ||
            err.code === 'P1001'

        let errorMessage = isConnError ? 'Database unreachable' : 'Failed to lookup player'

        // Targeted DB URL sanity warning
        if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('db.prisma.io')) {
            errorMessage += ' (Caution: DATABASE_URL seems to be pointing to Prisma Data Proxy in local dev)'
        }

        if (process.env.NODE_ENV === 'development') {
            console.error(`[getCurrentPlayerSafe] ${errorMessage}:`, err.message)
        }

        return {
            playerId: playerId || null,
            player: null,
            isAdmin: false,
            dbError: isConnError,
            errorMessage
        }
    }
})
