'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'

// Get the singleton AppConfig (create if doesn't exist)
export async function getAppConfig() {
    const baseSelect = {
        id: true,
        features: true,
        theme: true,
        heroTitle: true,
        heroSubtitle: true,
        updatedAt: true,
        updatedBy: true,
        orientationQuestId: true,
    } as const

    const selectWithInstance = {
        ...baseSelect,
        activeInstanceId: true,
        defaultLobbyMapId: true,
    } as const

    // 1) Try reading with the newest schema fields
    try {
        const config = await db.appConfig.findUnique({
            where: { id: 'singleton' },
            select: selectWithInstance,
        })
        if (config) return config
    } catch {
        // If the DB hasn't been pushed yet, selecting new columns will throw.
    }

    // 2) Fallback read that avoids referencing newly-added columns.
    let fallback = await db.appConfig.findUnique({
        where: { id: 'singleton' },
        select: baseSelect,
    })

    // 3) Ensure the singleton row exists without referencing any new columns.
    if (!fallback) {
        await db.$executeRaw(
            // app_config.updatedAt is NOT NULL and has no DB default (it’s managed by Prisma).
            // When we insert via raw SQL (schema-drift safe), we must supply it.
            Prisma.sql`INSERT INTO "app_config" ("id", "updatedAt") VALUES ('singleton', NOW()) ON CONFLICT ("id") DO NOTHING;`
        )

        fallback = await db.appConfig.findUnique({
            where: { id: 'singleton' },
            select: baseSelect,
        })
    }

    // Provide a consistent shape for callers.
    return {
        ...fallback,
        activeInstanceId: null,
        defaultLobbyMapId: null,
    }
}

// Update feature flags
export async function updateFeatures(formData: FormData) {
    const cookieStore = await cookies()
    const adminId = cookieStore.get('bars_player_id')?.value

    if (!adminId) return { error: 'Not authenticated' }

    const featuresJson = formData.get('features') as string
    let features: Record<string, boolean> = {}

    try {
        features = JSON.parse(featuresJson)
    } catch {
        return { error: 'Invalid JSON' }
    }

    const oldConfig = await getAppConfig()

    await db.appConfig.update({
        where: { id: 'singleton' },
        data: {
            features: JSON.stringify(features),
            updatedBy: adminId
        }
    })

    // Audit log
    await db.adminAuditLog.create({
        data: {
            adminId,
            action: 'feature_toggle',
            target: 'features',
            payload: JSON.stringify({ old: oldConfig.features, new: features })
        }
    })

    revalidatePath('/admin/config')
    revalidatePath('/')
    return { success: true }
}

// Update hero text
export async function updateHeroText(formData: FormData) {
    const cookieStore = await cookies()
    const adminId = cookieStore.get('bars_player_id')?.value

    if (!adminId) return { error: 'Not authenticated' }

    const heroTitle = formData.get('heroTitle') as string
    const heroSubtitle = formData.get('heroSubtitle') as string

    await db.appConfig.update({
        where: { id: 'singleton' },
        data: {
            heroTitle: heroTitle || null,
            heroSubtitle: heroSubtitle || null,
            updatedBy: adminId
        }
    })

    // Audit log
    await db.adminAuditLog.create({
        data: {
            adminId,
            action: 'config_update',
            target: 'hero_text',
            payload: JSON.stringify({ heroTitle, heroSubtitle })
        }
    })

    revalidatePath('/admin/config')
    revalidatePath('/')
    return { success: true }
}

// Update default lobby map
export async function updateDefaultLobbyMap(formData: FormData) {
    const cookieStore = await cookies()
    const adminId = cookieStore.get('bars_player_id')?.value

    if (!adminId) return { error: 'Not authenticated' }

    const defaultLobbyMapId = (formData.get('defaultLobbyMapId') as string) ?? null
    const value = defaultLobbyMapId?.trim() || null

    await db.appConfig.update({
        where: { id: 'singleton' },
        data: {
            defaultLobbyMapId: value,
            updatedBy: adminId
        }
    })

    // Audit log
    await db.adminAuditLog.create({
        data: {
            adminId,
            action: 'config_update',
            target: 'default_lobby_map',
            payload: JSON.stringify({ defaultLobbyMapId: value })
        }
    })

    revalidatePath('/admin/config')
    revalidatePath('/lobby')
    revalidatePath('/game-map')
    return { success: true }
}

// Update orientation quest
export async function updateOrientationQuest(formData: FormData) {
    const cookieStore = await cookies()
    const adminId = cookieStore.get('bars_player_id')?.value

    if (!adminId) return { error: 'Not authenticated' }

    const orientationQuestId = formData.get('orientationQuestId') as string

    await db.appConfig.update({
        where: { id: 'singleton' },
        data: {
            orientationQuestId: orientationQuestId || null,
            updatedBy: adminId
        }
    })

    // Audit log
    await db.adminAuditLog.create({
        data: {
            adminId,
            action: 'config_update',
            target: 'orientation_quest',
            payload: JSON.stringify({ orientationQuestId })
        }
    })

    revalidatePath('/admin/config')
    revalidatePath('/')
    revalidatePath('/onboarding')
    return { success: true }
}

// Get recent audit logs
export async function getRecentAuditLogs(limit = 10) {
    return db.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit
    })
}

/**
 * Get post-signup redirect target. Configurable per instance.
 * Default 'dashboard' for new campaign model; 'conclave' for legacy Party flow.
 */
export async function getPostSignupRedirect(): Promise<'conclave' | 'dashboard'> {
    try {
        const config = await db.appConfig.findUnique({
            where: { id: 'singleton' },
            select: { postSignupRedirect: true }
        })
        const val = config?.postSignupRedirect
        if (val === 'conclave' || val === 'dashboard') return val
        return 'dashboard'
    } catch {
        return 'dashboard'
    }
}

/**
 * Compute dashboard redirect URL for a player with orientation progress.
 * Returns /?focusQuest={questId} when there is a current orientation quest, else /.
 */
export async function getDashboardRedirectForPlayer(playerId: string): Promise<string> {
    const progress = await db.threadProgress.findFirst({
        where: {
            playerId,
            completedAt: null,
            thread: { threadType: 'orientation' }
        },
        include: {
            thread: {
                include: {
                    quests: {
                        orderBy: { position: 'asc' },
                        include: { quest: true }
                    }
                }
            }
        }
    })
    if (!progress) return '/'
    const currentThreadQuest = progress.thread.quests.find(
        q => q.position === progress.currentPosition
    )
    if (!currentThreadQuest) return '/'
    return `/?focusQuest=${currentThreadQuest.questId}`
}
