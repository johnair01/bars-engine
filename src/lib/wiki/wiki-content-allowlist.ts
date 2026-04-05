/** Max Markdown body length for wiki write API (chars). */
export const WIKI_CONTENT_MAX_CHARS = 400_000

/**
 * Only slugs under handbook/* can be written by API (expand later with care).
 */
export function isAllowedWikiContentSlug(slug: string): boolean {
  if (!slug || slug.length > 200) return false
  if (slug.includes('..') || slug.startsWith('/')) return false
  return slug.startsWith('handbook/')
}
