'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { runSeed } from '@/lib/seed-utils'

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
 * Admin only: Full system reset and re-seed
 */
export async function triggerSystemReset() {
    await ensureAdmin()

    console.log('⚠️  DANGER: System Reset Triggered by Admin')

    const tables = [
        'audit_logs', 'admin_audit_log', 'player_roles', 'thread_quests',
        'thread_progress', 'pack_progress', 'starter_quest_progress',
        'player_quests', 'vibulon_events', 'vibulons', 'starter_packs',
        'custom_bars', 'quest_threads', 'players', 'accounts', 'invites',
        'nations', 'playbooks', 'story_ticks', 'global_state', 'app_config', 'bars'
    ]

    for (const table of tables) {
        try {
            await db.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
        } catch (e) {
            try {
                await db.$executeRawUnsafe(`DELETE FROM "${table}";`)
            } catch (e2) {
                // Ignore missing tables or empty ones
            }
        }
    }

    // Re-seed
    await runSeed(db)

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
