/**
 * Campaign Share URL Generator
 *
 * Generates the canonical shareable URL for a campaign upon approval.
 * The URL uses the campaign's slug as the ref parameter, matching the
 * `/campaign/[ref]` route convention.
 *
 * The share URL is stored on the campaign record so that:
 * 1. It signals "this campaign is share-ready" (null = not yet approved)
 * 2. It provides a single source of truth for the public URL
 * 3. It can accommodate future custom domains or vanity URLs
 */

/**
 * Build the canonical share URL for a campaign.
 *
 * Uses NEXT_PUBLIC_BASE_URL when available (production), otherwise
 * falls back to a relative path (safe for dev / SSR contexts).
 */
export function buildCampaignShareUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  return `${base}/campaign/${encodeURIComponent(slug)}`
}

/**
 * Extract the slug from a campaign share URL.
 * Returns null if the URL doesn't match the expected pattern.
 */
export function extractSlugFromShareUrl(shareUrl: string): string | null {
  const match = shareUrl.match(/\/campaign\/([^/?#]+)/)
  if (!match) return null
  return decodeURIComponent(match[1])
}
