import { db } from '@/lib/db'

export type FeatureFlags = Record<string, boolean>

export function parseFeatureFlags(featuresJson?: string | null): FeatureFlags {
    if (!featuresJson) return {}
    try {
        const parsed = JSON.parse(featuresJson)
        if (parsed && typeof parsed === 'object') {
            return parsed as FeatureFlags
        }
    } catch {
        // Ignore malformed config and fall back to defaults.
    }
    return {}
}

export async function isFeatureEnabled(featureKey: string, defaultValue = true): Promise<boolean> {
    const config = await db.appConfig.findUnique({
        where: { id: 'singleton' },
        select: { features: true }
    })

    if (!config) return defaultValue
    const flags = parseFeatureFlags(config.features)
    return flags[featureKey] !== false
}
