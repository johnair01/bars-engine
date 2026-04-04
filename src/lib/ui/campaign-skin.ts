/**
 * Campaign skin tokens — visual theming for campaign-facing pages.
 *
 * Campaign skins apply to invitation surfaces (/event, /invite, /campaign, landing).
 * Game internals keep the dark cultivation aesthetic (SURFACE_TOKENS).
 *
 * The skin is applied via CSS custom properties on a wrapper element,
 * not by replacing Tailwind classes. This keeps markup clean and lets
 * skins swap by changing one variable set.
 *
 * ## Static vs Dynamic skins
 *
 * Static skins are code-defined baselines for known campaigns (e.g. Bruised Banana).
 * Dynamic skins are DB-driven via CampaignTheme (the L2 wizard path).
 *
 * `getCampaignSkin()` looks up static skins only. For the full three-layer merge
 * (static → DB columns → cssVarOverrides), use `resolveCampaignSkin()` from
 * `resolve-campaign-skin.ts`.
 *
 * Self-serve campaigns created via the wizard always use the DB-driven path:
 *   1. Steward picks a ThemePreset (or starts from MINIMAL_DARK default)
 *   2. Preset values are persisted into CampaignTheme columns
 *   3. `resolveCampaignSkin()` merges all layers and returns ResolvedCampaignSkin
 *   4. Static skins serve as fallback for legacy/reference campaigns only
 *
 * @see src/lib/ui/resolve-campaign-skin.ts — full three-layer resolver
 * @see src/lib/ui/theme-presets.ts          — preset definitions
 * @see src/lib/ui/build-skin-vars.ts        — merge pipeline
 */

import type { ThemeData } from './build-skin-vars'

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

/** Static skin registry — code-defined baselines for known campaigns */
const CAMPAIGN_SKINS: Record<string, CampaignSkin> = {
  'bruised-banana': BRUISED_BANANA_SKIN,
}

/**
 * Look up a static campaign skin by campaignRef or slug.
 * Returns null for unknown campaigns — caller should use resolveCampaignSkin()
 * for the full three-layer merge (static → DB → overrides).
 *
 * This function is synchronous and does not touch the database.
 * It exists for backward compatibility and as Layer 1 of the merge pipeline.
 */
export function getCampaignSkin(campaignRef: string | null | undefined): CampaignSkin | null {
  if (!campaignRef) return null
  return CAMPAIGN_SKINS[campaignRef] ?? null
}

/**
 * Check if a static skin exists for the given campaign ref.
 * Useful for determining if a campaign has a code-defined baseline
 * vs. being purely DB-driven (self-serve wizard path).
 */
export function hasStaticSkin(campaignRef: string | null | undefined): boolean {
  if (!campaignRef) return false
  return campaignRef in CAMPAIGN_SKINS
}

/**
 * List all available static skin keys.
 * Used by the backfill system to verify reference implementations.
 */
export function getStaticSkinKeys(): string[] {
  return Object.keys(CAMPAIGN_SKINS)
}

/**
 * Build a CampaignSkin-compatible object from ThemeData.
 *
 * This bridges the gap between DB-driven themes (ThemeData from CampaignTheme)
 * and the static CampaignSkin interface. Useful when a self-serve campaign
 * has a DB theme but no static skin, and you need a CampaignSkin object
 * for components that accept that interface.
 *
 * @param themeData - The theme data from CampaignTheme (DB or preset)
 * @param meta - Additional metadata not stored in ThemeData
 * @returns A CampaignSkin object synthesized from the theme data
 */
export function campaignSkinFromThemeData(
  themeData: ThemeData,
  meta: {
    displayName: string
    rsvpUrl?: string | null
    donatePath?: string
  },
): CampaignSkin {
  const cssVars: Record<string, string> = {}

  // Map ThemeData typed columns to CSS vars
  if (themeData.bgGradient) cssVars['--cs-bg-gradient'] = themeData.bgGradient
  if (themeData.bgDeep) {
    cssVars['--cs-bg-deep'] = themeData.bgDeep
    cssVars['--cs-bg'] = themeData.bgDeep
  }
  if (themeData.titleColor) cssVars['--cs-title'] = themeData.titleColor
  if (themeData.accentPrimary) cssVars['--cs-accent-1'] = themeData.accentPrimary
  if (themeData.accentSecondary) cssVars['--cs-accent-2'] = themeData.accentSecondary
  if (themeData.accentTertiary) cssVars['--cs-accent-3'] = themeData.accentTertiary
  if (themeData.greenAccent) cssVars['--cs-green'] = themeData.greenAccent
  if (themeData.surfaceColor) cssVars['--cs-surface'] = themeData.surfaceColor
  if (themeData.surfaceHoverColor) cssVars['--cs-surface-hover'] = themeData.surfaceHoverColor
  if (themeData.borderColor) cssVars['--cs-border'] = themeData.borderColor
  if (themeData.borderHoverColor) cssVars['--cs-border-hover'] = themeData.borderHoverColor
  if (themeData.textPrimary) cssVars['--cs-text-primary'] = themeData.textPrimary
  if (themeData.textSecondary) cssVars['--cs-text-secondary'] = themeData.textSecondary
  if (themeData.textMuted) cssVars['--cs-text-muted'] = themeData.textMuted
  if (themeData.ctaBg) cssVars['--cs-cta-bg'] = themeData.ctaBg
  if (themeData.ctaText) cssVars['--cs-cta-text'] = themeData.ctaText
  if (themeData.ctaHoverBg) cssVars['--cs-cta-hover'] = themeData.ctaHoverBg

  // Merge cssVarOverrides last (highest priority within this object)
  if (themeData.cssVarOverrides) {
    Object.assign(cssVars, themeData.cssVarOverrides)
  }

  return {
    cssVars,
    fontClass: themeData.fontDisplayKey ? `font-${themeData.fontDisplayKey}` : '',
    displayName: meta.displayName,
    rsvpUrl: meta.rsvpUrl ?? null,
    donatePath: meta.donatePath ?? '/donate',
  }
}
