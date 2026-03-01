/**
 * Avatar config derived from CYOA/character creation choices.
 * Uses name-based slugs for stable sprite part paths.
 */

export type AvatarConfig = {
    nationKey: string
    playbookKey: string
    domainKey?: string
    variant: string
    genderKey?: 'male' | 'female' | 'neutral' | 'default'
}

export type DeriveAvatarConfigOptions = {
    nationName?: string | null
    playbookName?: string | null
    pronouns?: string | null
}

/**
 * Slugify a display name for stable part keys (e.g. "The Bold Heart" → "bold-heart").
 */
export function slugifyName(name: string): string {
    return name
        .toLowerCase()
        .replace(/^the\s+/i, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'unknown'
}

/**
 * Derive gender key from pronouns for avatar base selection.
 */
export function deriveGenderFromPronouns(
    pronouns?: string | null
): AvatarConfig['genderKey'] {
    if (!pronouns?.trim()) return 'default'
    const p = pronouns.toLowerCase()
    if (/\b(he|him|his)\b/.test(p)) return 'male'
    if (/\b(she|her|hers)\b/.test(p)) return 'female'
    if (/\b(they|them|their)\b/.test(p)) return 'neutral'
    return 'default'
}

/**
 * Derive avatar config from nation, playbook, and domain.
 * Prefer nationName/playbookName for stable keys; fall back to slugifyId when not provided.
 * Returns null if insufficient data to derive.
 */
export function deriveAvatarConfig(
    nationId?: string | null,
    playbookId?: string | null,
    campaignDomainPreference?: string | null,
    options?: DeriveAvatarConfigOptions
): string | null {
    const nationKey = options?.nationName
        ? slugifyName(options.nationName)
        : nationId
          ? slugifyId(nationId)
          : ''
    const playbookKey = options?.playbookName
        ? slugifyName(options.playbookName)
        : playbookId
          ? slugifyId(playbookId)
          : ''
    if (!nationKey && !playbookKey) return null

    let domainKey = ''
    if (campaignDomainPreference) {
        try {
            const parsed = JSON.parse(campaignDomainPreference) as unknown
            const arr = Array.isArray(parsed) ? parsed : typeof parsed === 'string' ? [parsed] : []
            domainKey = (arr[0] as string) || ''
        } catch {
            domainKey = typeof campaignDomainPreference === 'string' ? campaignDomainPreference : ''
        }
    }

    const config: AvatarConfig = {
        nationKey: nationKey || 'unknown',
        playbookKey: playbookKey || 'unknown',
        domainKey: domainKey || undefined,
        variant: 'default',
        genderKey: deriveGenderFromPronouns(options?.pronouns)
    }
    return JSON.stringify(config)
}

function slugifyId(id: string): string {
    // Use first 8 chars for stable key; CUIDs are random so use full id hashed to short form
    if (id.length <= 12) return id
    return id.slice(0, 8)
}

/**
 * Parse avatar config from JSON string.
 */
export function parseAvatarConfig(avatarConfig: string | null): AvatarConfig | null {
    if (!avatarConfig?.trim()) return null
    try {
        const parsed = JSON.parse(avatarConfig) as AvatarConfig
        if (parsed?.nationKey || parsed?.playbookKey) return parsed
    } catch {
        // ignore
    }
    return null
}

/**
 * Get hue (0-360) from config for colored placeholder.
 */
export function getAvatarHue(config: AvatarConfig | null): number {
    if (!config) return 200 // default teal
    const str = (config.nationKey || '') + (config.playbookKey || '')
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash % 360)
}

/**
 * Get initials for avatar placeholder.
 * v1: Prefer name initials (e.g. "JD" for "John Doe"); config provides color only.
 */
export function getAvatarInitials(config: AvatarConfig | null, fallbackName?: string): string {
    if (fallbackName?.trim()) {
        const parts = fallbackName.trim().split(/\s+/)
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
        }
        return fallbackName.slice(0, 2).toUpperCase()
    }
    if (config) {
        const n = (config.nationKey || '').charAt(0).toUpperCase()
        const p = (config.playbookKey || '').charAt(0).toUpperCase()
        if (n || p) return (n + p) || '?'
    }
    return '?'
}
