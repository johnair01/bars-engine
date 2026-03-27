'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'

/** Safe defaults when Postgres is down (P1001) or config read fails entirely. */
const APP_CONFIG_FALLBACK = {
    id: 'singleton' as const,
    features: null as string | null,
    theme: null as string | null,
    heroTitle: null as string | null,
    heroSubtitle: null as string | null,
    updatedAt: new Date(0),
    updatedBy: null as string | null,
    orientationQuestId: null as string | null,
    activeInstanceId: null as string | null,
    defaultLobbyMapId: null as string | null,
}

// Get the singleton AppConfig (create if doesn't exist)
export async function getAppConfig() {
    try {
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
        if (!fallback) {
            return { ...APP_CONFIG_FALLBACK }
        }
        return {
            ...fallback,
            activeInstanceId: null,
            defaultLobbyMapId: null,
        }
    } catch (e) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[getAppConfig] DB unreachable or misconfigured:', e)
        }
        return { ...APP_CONFIG_FALLBACK }
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

export type PostOnboardingRedirectTarget = 'dashboard' | 'campaign-map'

/**
 * After onboarding, where to send players when they would otherwise land on `/` (dashboard home).
 * Stored in AppConfig.features JSON: `{ "postOnboardingRedirect": "campaign-map" }`.
 * Default: dashboard (`/`).
 */
export async function getPostOnboardingRedirect(): Promise<PostOnboardingRedirectTarget> {
    try {
        const config = await db.appConfig.findUnique({
            where: { id: 'singleton' },
            select: { features: true },
        })
        const features = config?.features
            ? (JSON.parse(config.features) as Record<string, unknown>)
            : {}
        const raw = features.postOnboardingRedirect
        if (raw === 'campaign-map' || raw === 'dashboard') return raw
        return 'dashboard'
    } catch {
        return 'dashboard'
    }
}

async function resolvePostOnboardingBoardPath(): Promise<string> {
    const cfg = await db.appConfig.findUnique({
        where: { id: 'singleton' },
        select: { activeInstanceId: true },
    })
    if (cfg?.activeInstanceId) {
        const inst = await db.instance.findUnique({
            where: { id: cfg.activeInstanceId },
            select: { campaignRef: true, slug: true },
        })
        const ref = inst?.campaignRef ?? inst?.slug ?? 'bruised-banana'
        return `/campaign/board?ref=${encodeURIComponent(ref)}`
    }
    return '/campaign/board?ref=bruised-banana'
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
 * Returns /?focusQuest={questId} when there is a current orientation quest, else `/` or
 * `/campaign/board?ref=…` when `features.postOnboardingRedirect` is `campaign-map`.
 */
export async function getDashboardRedirectForPlayer(playerId: string): Promise<string> {
    const applyHomePreference = async (path: string): Promise<string> => {
        if (path !== '/' && path !== '') return path
        const prefer = await getPostOnboardingRedirect()
        if (prefer === 'campaign-map') return resolvePostOnboardingBoardPath()
        return '/'
    }

    /** Hidden journeys — do not auto-open their current quest on signup redirect. */
    const skipThreadIds = new Set(['k-space-librarian-thread'])

    const progressList = await db.threadProgress.findMany({
        where: {
            playerId,
            completedAt: null,
            thread: { threadType: 'orientation' },
        },
        include: {
            thread: {
                include: {
                    quests: {
                        orderBy: { position: 'asc' },
                        include: { quest: true },
                    },
                },
            },
        },
    })

    const candidates = progressList.filter((p) => !skipThreadIds.has(p.threadId))
    if (candidates.length === 0) return applyHomePreference('/')

    const bbExact = candidates.find((p) => p.threadId === `bruised-banana-orientation-${playerId}`)
    const bbOther = candidates.find((p) => p.threadId.startsWith('bruised-banana-orientation-'))
    const rest = candidates
        .filter((p) => p !== bbExact && p !== bbOther)
        .sort(
            (a, b) =>
                a.thread.createdAt.getTime() - b.thread.createdAt.getTime()
        )
    const progress = bbExact ?? bbOther ?? rest[0]
    if (!progress) return applyHomePreference('/')

    const currentThreadQuest = progress.thread.quests.find(
        (q) => q.position === progress.currentPosition
    )
    if (!currentThreadQuest) return applyHomePreference('/')
    return `/?focusQuest=${currentThreadQuest.questId}`
}
