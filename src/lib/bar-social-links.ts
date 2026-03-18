/**
 * BAR Social Links — platform detection, URL validation, allowlist.
 */

export type SocialPlatform = 'instagram' | 'spotify' | 'twitter' | 'youtube' | 'generic'

const ALLOWLIST: { platform: SocialPlatform; patterns: RegExp[] }[] = [
  { platform: 'youtube', patterns: [/^https?:\/\/(www\.)?youtube\.com\//, /^https?:\/\/youtu\.be\//] },
  { platform: 'spotify', patterns: [/^https?:\/\/open\.spotify\.com\//] },
  { platform: 'instagram', patterns: [/^https?:\/\/(www\.)?instagram\.com\//] },
  { platform: 'twitter', patterns: [/^https?:\/\/(www\.)?(twitter|x)\.com\//] },
  { platform: 'generic', patterns: [/^https?:\/\/(www\.)?vimeo\.com\//, /^https?:\/\/([a-z0-9-]+\.)?substack\.com\//] },
]

const MAX_LINKS_PER_BAR = 5

export function detectPlatform(url: string): SocialPlatform | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  for (const { platform, patterns } of ALLOWLIST) {
    if (patterns.some((p) => p.test(trimmed))) return platform
  }
  return null
}

export function validateSocialUrl(url: string): { ok: true; platform: SocialPlatform } | { ok: false; error: string } {
  const trimmed = url.trim()
  if (!trimmed) return { ok: false, error: 'URL is required' }
  try {
    new URL(trimmed)
  } catch {
    return { ok: false, error: 'Invalid URL' }
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { ok: false, error: 'URL must start with http:// or https://' }
  }
  const platform = detectPlatform(trimmed)
  if (!platform) {
    return { ok: false, error: 'URL must be from a supported platform (YouTube, Spotify, Instagram, Twitter/X, Vimeo, Substack)' }
  }
  return { ok: true, platform }
}

/**
 * Validate URL for a specific platform. Use when adding from platform-specific button.
 */
export function validateSocialUrlForPlatform(
  url: string,
  expectedPlatform: SocialPlatform
): { ok: true; platform: SocialPlatform } | { ok: false; error: string } {
  const result = validateSocialUrl(url)
  if (!result.ok) return result
  if (result.platform !== expectedPlatform) {
    const labels: Record<SocialPlatform, string> = {
      youtube: 'YouTube',
      spotify: 'Spotify',
      instagram: 'Instagram',
      twitter: 'Twitter/X',
      generic: 'a supported platform',
    }
    return { ok: false, error: `Please paste a ${labels[expectedPlatform]} link` }
  }
  return result
}

export function getMaxLinksPerBar(): number {
  return MAX_LINKS_PER_BAR
}

export function getPlatformLabel(platform: string): string {
  switch (platform) {
    case 'youtube':
      return 'Watch'
    case 'spotify':
      return 'Listen to'
    case 'instagram':
    case 'twitter':
      return 'Inspired by'
    default:
      return 'Link'
  }
}

/**
 * Extract YouTube video ID from URL for embed.
 * Supports youtube.com/watch?v=ID and youtu.be/ID.
 */
export function getYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  const m1 = trimmed.match(/[?&]v=([^&]+)/)
  const m2 = trimmed.match(/youtu\.be\/([^?&]+)/)
  return m1?.[1] ?? m2?.[1] ?? null
}
