/**
 * Campaign skin tokens — visual theming for campaign-facing pages.
 *
 * Campaign skins apply to invitation surfaces (/event, /invite, /campaign, landing).
 * Game internals keep the dark cultivation aesthetic (SURFACE_TOKENS).
 *
 * The skin is applied via CSS custom properties on a wrapper element,
 * not by replacing Tailwind classes. This keeps markup clean and lets
 * skins swap by changing one variable set.
 */

export interface CampaignSkin {
  /** CSS custom properties to spread onto a wrapper's style prop */
  cssVars: Record<string, string>
  /** Tailwind class for the pixel/display font (titles only) */
  fontClass: string
  /** Campaign display name */
  displayName: string
  /** External RSVP URL (e.g. Partiful link) */
  rsvpUrl: string | null
  /** Donate path within the app */
  donatePath: string
}

const BRUISED_BANANA_SKIN: CampaignSkin = {
  cssVars: {
    '--cs-bg': '#1a1a5e',
    '--cs-bg-deep': '#12124a',
    '--cs-bg-gradient': 'linear-gradient(180deg, #1a1a5e 0%, #2b2b8a 30%, #1a1a5e 100%)',
    '--cs-title': '#f0d000',
    '--cs-accent-1': '#c8a0ff',   // lavender
    '--cs-accent-2': '#00d4ff',   // cyan
    '--cs-accent-3': '#ff69b4',   // pink
    '--cs-green': '#4ade80',      // green (for progress, success)
    '--cs-surface': 'rgba(10, 10, 40, 0.6)',
    '--cs-surface-hover': 'rgba(20, 20, 60, 0.7)',
    '--cs-border': 'rgba(200, 160, 255, 0.15)',
    '--cs-border-hover': 'rgba(200, 160, 255, 0.3)',
    '--cs-text-primary': '#e8e6e0',
    '--cs-text-secondary': '#9090c0',
    '--cs-text-muted': '#6060a0',
    '--cs-cta-bg': '#f0d000',
    '--cs-cta-text': '#12124a',
    '--cs-cta-hover': '#ffe033',
    '--cs-cta-secondary-bg': 'rgba(200, 160, 255, 0.15)',
    '--cs-cta-secondary-text': '#c8a0ff',
    '--cs-cta-secondary-border': 'rgba(200, 160, 255, 0.4)',
    '--cs-cta-secondary-hover': 'rgba(200, 160, 255, 0.25)',
  },
  fontClass: 'font-pixel',
  displayName: 'The Bruised Banana',
  rsvpUrl: null, // set per-instance if Partiful link exists
  donatePath: '/event/donate/wizard',
}

const CAMPAIGN_SKINS: Record<string, CampaignSkin> = {
  'bruised-banana': BRUISED_BANANA_SKIN,
}

/**
 * Look up a campaign skin by campaignRef.
 * Returns null for unknown campaigns — caller falls back to default dark theme.
 */
export function getCampaignSkin(campaignRef: string | null | undefined): CampaignSkin | null {
  if (!campaignRef) return null
  return CAMPAIGN_SKINS[campaignRef] ?? null
}
