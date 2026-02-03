'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Get the singleton AppConfig (create if doesn't exist)
export async function getAppConfig() {
    let config = await db.appConfig.findUnique({
        where: { id: 'singleton' }
    })

    if (!config) {
        config = await db.appConfig.create({
            data: { id: 'singleton' }
        })
    }

    return config
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
            features,
            updatedBy: adminId
        }
    })

    // Audit log
    await db.adminAuditLog.create({
        data: {
            adminId,
            action: 'feature_toggle',
            target: 'features',
            payload: { old: oldConfig.features, new: features }
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
            payload: { heroTitle, heroSubtitle }
        }
    })

    revalidatePath('/admin/config')
    revalidatePath('/')
    return { success: true }
}

// Get recent audit logs
export async function getRecentAuditLogs(limit = 10) {
    return db.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit
    })
}
