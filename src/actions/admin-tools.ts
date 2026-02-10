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

    if (!player) throw new Error('Not authorized: Player not found')
    const isAdmin = player.roles.some(r => r.role.key === 'admin')
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
    const admin = await ensureAdmin()
    const resetRunId = `admin_reset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const startedAt = new Date()

    console.log('⚠️  DANGER: System Reset Triggered by Admin')
    await db.auditLog.create({
        data: {
            actorAdminId: admin.id,
            action: 'SYSTEM_RESET_STARTED',
            targetType: 'system',
            targetId: resetRunId,
            payloadJson: JSON.stringify({
                resetRunId,
                source: 'admin_panel',
                startedAt: startedAt.toISOString(),
                actor: {
                    id: admin.id,
                    name: admin.name,
                    contactValue: admin.contactValue
                }
            })
        }
    })

    const tables = [
        // Keep audit_logs so reset history survives resets.
        'admin_audit_log', 'player_roles', 'thread_quests',
        'thread_progress', 'pack_progress', 'starter_quest_progress',
        'player_quests', 'vibulon_events', 'vibulons', 'starter_packs',
        'custom_bars', 'quest_threads', 'players', 'accounts', 'invites',
        'nations', 'playbooks', 'story_ticks', 'global_state', 'app_config', 'bars'
    ]

    const resetSummary = {
        truncated: [] as string[],
        deleted: [] as string[],
        skipped: [] as string[]
    }

    try {
        for (const table of tables) {
            try {
                await db.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
                resetSummary.truncated.push(table)
            } catch {
                try {
                    await db.$executeRawUnsafe(`DELETE FROM "${table}";`)
                    resetSummary.deleted.push(table)
                } catch {
                    // Ignore missing tables or empty ones
                    resetSummary.skipped.push(table)
                }
            }
        }

        // Re-seed
        await runSeed(db)

        await db.auditLog.create({
            data: {
                actorAdminId: admin.id,
                action: 'SYSTEM_RESET_COMPLETED',
                targetType: 'system',
                targetId: resetRunId,
                payloadJson: JSON.stringify({
                    resetRunId,
                    source: 'admin_panel',
                    startedAt: startedAt.toISOString(),
                    completedAt: new Date().toISOString(),
                    summary: resetSummary
                })
            }
        })
    } catch (error) {
        await db.auditLog.create({
            data: {
                actorAdminId: admin.id,
                action: 'SYSTEM_RESET_FAILED',
                targetType: 'system',
                targetId: resetRunId,
                payloadJson: JSON.stringify({
                    resetRunId,
                    source: 'admin_panel',
                    startedAt: startedAt.toISOString(),
                    failedAt: new Date().toISOString(),
                    error: error instanceof Error ? error.message : String(error),
                    summary: resetSummary
                })
            }
        })
        throw error
    }

    revalidatePath('/')
    return { success: true, resetRunId }
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
