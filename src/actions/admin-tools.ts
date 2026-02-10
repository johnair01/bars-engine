'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { runSeed } from '@/lib/seed-utils'
import { runIChingHardening } from '@/lib/iching-hardening'
import { lifecycleEventMarker } from '@/lib/lifecycle-events'

async function ensureAdmin() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) throw new Error('Not authenticated')

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    if (!player) throw new Error('Not authenticated')

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

/**
 * Admin only: apply idempotent I Ching data hardening.
 */
export async function runIChingDataHardening() {
    try {
        const admin = await ensureAdmin()
        const report = await runIChingHardening(db)

        await db.adminAuditLog.create({
            data: {
                adminId: admin.id,
                action: 'iching_hardening',
                target: 'iching_data',
                payload: JSON.stringify(report)
            }
        })

        revalidatePath('/')
        revalidatePath('/iching')
        revalidatePath('/admin')

        return { success: true, report }
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        return { success: false, error: message }
    }
}

export type LifecycleMetrics = {
    windowHours: number
    generatedAt: string
    castAttempts: number
    castsRevealed: number
    cooldownBlocks: number
    castFailures: number
    generationFailures: number
    questsGenerated: number
    barsLogged: number
    barsPromoted: number
    barsModified: number
    modifierFailures: number
    hexQuestsCreated: number
    hexAssignments: number
    hexCompletions: number
    privateNonHexCompletions: number
    privateHexCompletions: number
    castToQuestRate: number
    hexQuestCompletionRate: number
}

function asPercent(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0
    return Number(((numerator / denominator) * 100).toFixed(1))
}

/**
 * Admin only: lifecycle snapshot for BAR/Quest loop observability.
 */
export async function getLifecycleMetrics() {
    try {
        await ensureAdmin()
        const windowHours = 24
        const since = new Date(Date.now() - windowHours * 60 * 60 * 1000)

        const [
            castAttempts,
            castsRevealed,
            cooldownBlocks,
            castFailures,
            generationFailures,
            questsGenerated,
            barsLogged,
            barsPromoted,
            barsModified,
            modifierFailures,
            hexQuestsCreated,
            hexAssignments,
            hexCompletions,
            privateNonHexCompletions,
            privateHexCompletions,
        ] = await Promise.all([
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('ICHING_CAST_ATTEMPT') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('ICHING_CAST_REVEALED') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('ICHING_CAST_COOLDOWN_BLOCKED') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('ICHING_CAST_FAILED') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('ICHING_QUEST_GENERATION_FAILED') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('ICHING_QUEST_GENERATED') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('BAR_LOGGED') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('BAR_PROMOTED_TO_QUEST') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('BAR_MODIFIER_APPLIED') }
                }
            }),
            db.vibulonEvent.count({
                where: {
                    source: 'lifecycle',
                    createdAt: { gte: since },
                    notes: { contains: lifecycleEventMarker('BAR_MODIFIER_FAILED') }
                }
            }),
            db.customBar.count({
                where: {
                    createdAt: { gte: since },
                    hexagramId: { not: null },
                }
            }),
            db.playerQuest.count({
                where: {
                    assignedAt: { gte: since },
                    quest: { hexagramId: { not: null } }
                }
            }),
            db.playerQuest.count({
                where: {
                    completedAt: { gte: since },
                    quest: { hexagramId: { not: null } }
                }
            }),
            db.playerQuest.count({
                where: {
                    completedAt: { gte: since },
                    quest: {
                        visibility: 'private',
                        hexagramId: null
                    }
                }
            }),
            db.playerQuest.count({
                where: {
                    completedAt: { gte: since },
                    quest: {
                        visibility: 'private',
                        hexagramId: { not: null }
                    }
                }
            }),
        ])

        const metrics: LifecycleMetrics = {
            windowHours,
            generatedAt: new Date().toISOString(),
            castAttempts,
            castsRevealed,
            cooldownBlocks,
            castFailures,
            generationFailures,
            questsGenerated,
            barsLogged,
            barsPromoted,
            barsModified,
            modifierFailures,
            hexQuestsCreated,
            hexAssignments,
            hexCompletions,
            privateNonHexCompletions,
            privateHexCompletions,
            castToQuestRate: asPercent(questsGenerated, castsRevealed),
            hexQuestCompletionRate: asPercent(hexCompletions, hexAssignments),
        }

        return { success: true, metrics }
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        return { success: false, error: message }
    }
}
