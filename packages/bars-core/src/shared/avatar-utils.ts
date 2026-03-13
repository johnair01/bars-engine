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
