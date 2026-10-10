/**
 * Source tags for the coaching page's booking links.
 *
 * A link to the coaching page can carry utm_source, utm_medium, utm_campaign, utm_content and utm_term
 * (for example ?utm_source=podcast&utm_campaign=ep4 in a show's notes). Vercel Web Analytics counts
 * visits by these tags. Calendly reads the same five names on a scheduling link and keeps them on the
 * booking it creates, so passing them through lets a booking be traced to the place that sent the visitor.
 * Design choice (lead-gen pass 1, 2026-10-10): only these five tags pass through; nothing the visitor
 * writes on the walk ever goes into a link.
 */

export const SOURCE_TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

/** The source tags present in a page's query string, in SOURCE_TAGS order. Empty values are dropped. */
export function readSourceTags(search: string): [string, string][] {
  const params = new URLSearchParams(search)
  const tags: [string, string][] = []
  for (const name of SOURCE_TAGS) {
    const value = params.get(name)?.trim()
    if (value) tags.push([name, value.slice(0, 100)])
  }
  return tags
}

/** The booking link with the visitor's source tags added. A tag already on the link is left as it is. */
export function withSourceTags(href: string, tags: [string, string][]): string {
  if (tags.length === 0) return href
  const url = new URL(href)
  for (const [name, value] of tags) {
    if (!url.searchParams.has(name)) url.searchParams.set(name, value)
  }
  return url.toString()
}
