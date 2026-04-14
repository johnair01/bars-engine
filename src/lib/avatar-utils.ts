/**
 * Avatar config derived from CYOA/character creation choices.
 * Uses name-based slugs for stable sprite part paths.
 *
 * **ARDS — one `AvatarConfig`, three character-scale renderers:**
 * 1. **Portrait (Register 3)** — `getAvatarPartSpecs()` → layered PNGs in `Avatar.tsx` / `CharacterCreatorAvatarPreview`.
 *    Optional `register3` + `element` applies Register 3 crop + vignette (`register-portrait.ts`).
 * 2. **Walk sprite (Register 4)** — `getWalkableSpriteUrl()` → `public/sprites/walkable/{nationKey}-{archetypeKey}.png`
 *    composited in Pixi (`RoomRenderer`). Nation sheet tints align with `ELEMENT_TOKENS` via `nation-element.ts`.
 * 3. **Provenance stamp (Register 2)** — planned `resolveProvenanceStamp()` (provenance-stamp-system spec) — BAR/quest corners.
 */

export type AvatarConfig = {
    nationKey: string
    archetypeKey: string
    domainKey?: string
    variant: string
    genderKey?: 'male' | 'female' | 'neutral' | 'default'
}

/** Demo walkable sheet under `public/sprites/walkable/argyra-bold-heart.png`. */
export const WALKABLE_SPRITE_DEMO_AVATAR: AvatarConfig = {
    nationKey: 'argyra',
    archetypeKey: 'bold-heart',
    variant: 'default',
}

export type DeriveAvatarConfigOptions = {
    nationName?: string | null
    archetypeName?: string | null
    pronouns?: string | null
    /** Override base variant; when set, used instead of deriveGenderFromPronouns */
    genderKey?: AvatarConfig['genderKey']
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
        .replace(/^-|-$/g, '') || ''
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
 * Derive avatar config from nation, archetype, and domain.
 * Prefer nationName/archetypeName for stable keys; fall back to slugifyId when not provided.
 * Returns null if insufficient data to derive.
 */
export function deriveAvatarConfig(
    nationId?: string | null,
    archetypeId?: string | null,
    campaignDomainPreference?: string | null,
    options?: DeriveAvatarConfigOptions
): string | null {
    const nationKey = options?.nationName
        ? slugifyName(options.nationName)
        : nationId
          ? slugifyId(nationId)
          : ''
    const archetypeKey = options?.archetypeName
        ? slugifyName(options.archetypeName)
        : archetypeId
          ? slugifyId(archetypeId)
          : ''
    if (!nationKey && !archetypeKey) return null

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
        nationKey: nationKey || '',
        archetypeKey: archetypeKey || '',
        domainKey: domainKey || undefined,
        variant: 'default',
        genderKey: options?.genderKey ?? deriveGenderFromPronouns(options?.pronouns)
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
        const parsed = JSON.parse(avatarConfig) as Record<string, unknown>
        if (!parsed || typeof parsed !== 'object' || !('nationKey' in parsed || 'archetypeKey' in parsed || 'playbookKey' in parsed))
            return null
        // Normalize legacy playbookKey → archetypeKey
        const archetypeKey = (parsed.archetypeKey as string) || (parsed.playbookKey as string) || ''
        return {
            nationKey: (parsed.nationKey as string) || '',
            archetypeKey,
            domainKey: parsed.domainKey as string | undefined,
            variant: (parsed.variant as string) || 'default',
            genderKey: parsed.genderKey as AvatarConfig['genderKey']
        }
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
    const str = (config.nationKey || '') + (config.archetypeKey || '')
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash % 360)
}

/**
 * Get walkable spritesheet URL for spatial map (top-down avatar).
 * Key: {nationKey}-{archetypeKey}; fallback to default when either missing.
 * See docs/WALKABLE_SPRITES.md for format.
 */
export function getWalkableSpriteUrl(config: AvatarConfig | null): string {
    if (!config?.nationKey || !config?.archetypeKey) {
        return '/sprites/walkable/default.png'
    }
    const key = `${config.nationKey}-${config.archetypeKey}`
    return `/sprites/walkable/${key}.png`
}

/** Player shape for resolving avatar config (nation/archetype included). */
export type PlayerForAvatar = {
    avatarConfig?: string | null
    nationId?: string | null
    archetypeId?: string | null
    campaignDomainPreference?: string | null
    nation?: { name: string } | null
    archetype?: { name: string } | null
    pronouns?: string | null
}

/**
 * Resolve avatar config for a player: use stored config if valid, else derive from nation+archetype.
 * Returns null if player has no nation/archetype and no valid stored config.
 */
export function resolveAvatarConfigForPlayer(player: PlayerForAvatar | null): string | null {
    if (!player) return null
    const parsed = parseAvatarConfig(player.avatarConfig ?? null)
    if (parsed?.nationKey && parsed?.archetypeKey) return player.avatarConfig ?? null
    return deriveAvatarConfig(
        player.nationId ?? null,
        player.archetypeId ?? null,
        player.campaignDomainPreference ?? null,
        {
            nationName: player.nation?.name,
            archetypeName: player.archetype?.name,
            pronouns: player.pronouns,
        }
    )
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
        const p = (config.archetypeKey || '').charAt(0).toUpperCase()
        if (n || p) return (n + p) || '?'
    }
    return '?'
}
