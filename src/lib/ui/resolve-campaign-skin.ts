/**
 * Server-side campaign skin resolution utility.
 *
 * Centralizes the pattern of loading a campaign's DB theme, merging it
 * with the static skin fallback, and returning a fully resolved skin
 * ready for rendering.
 *
 * Three-layer merge (lowest → highest priority):
 *   1. Default theme (MINIMAL_DARK) — always-present baseline
 *   2. Static skin (getCampaignSkin) — code-defined per campaignRef
 *   3. DB theme (CampaignTheme columns + cssVarOverrides) — L2 wizard
 *
 * Usage in Server Components:
 *   const resolved = await resolveCampaignSkin({ slug: 'bruised-banana' })
 *   return <div style={resolved.cssProperties}>...</div>
 *
 * Usage in Server Actions / Route Handlers:
 *   const resolved = await resolveCampaignSkin({ campaignId: 'cuid...' })
 *
 * @see src/lib/ui/build-skin-vars.ts — merge pipeline
 * @see src/lib/ui/campaign-skin.ts   — static skin registry
 * @see src/lib/ui/theme-presets.ts   — preset definitions
 * @see UI_COVENANT.md                — three-channel encoding
 */

import { db } from '@/lib/db'
import { getCampaignSkin, type CampaignSkin } from './campaign-skin'
import {
  buildSkinVars,
  resolveFontClass,
  resolveBodyFontClass,
  DEFAULT_BG_GRADIENT,
  type ThemeData,
} from './build-skin-vars'
import { MINIMAL_DARK_THEME_DATA } from './theme-presets'
import type { CampaignBorderTokens, CampaignDensityTokens } from './campaign-skin-tokens'
import {
  DEFAULT_BORDER_TOKENS,
  DEFAULT_DENSITY_TOKENS,
  CAMPAIGN_CSS_VAR_KEYS,
} from './campaign-skin-tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input — resolve by slug OR campaignId (exactly one required) */
export type ResolveSkinInput =
  | { slug: string; campaignId?: never }
  | { campaignId: string; slug?: never }

/**
 * Fully resolved campaign skin — everything a rendering surface needs.
 *
 * This is the output of the three-layer merge. Components should use
 * this object instead of calling getCampaignSkin + buildSkinVars manually.
 */
export type ResolvedCampaignSkin = {
  /** CSS custom properties to spread onto a wrapper's style prop */
  cssProperties: React.CSSProperties
  /** Tailwind class for display/heading font */
  fontDisplayClass: string
  /** Tailwind class for body text font */
  fontBodyClass: string
  /** Background gradient CSS value (for <body> or full-bleed wrappers) */
  bgGradient: string
  /** Deep background color (for meta theme-color, etc.) */
  bgDeep: string
  /** Campaign display name (from static skin or campaign record) */
  displayName: string | null
  /** Poster/banner image URL if set */
  posterImageUrl: string | null
  /** External RSVP URL (e.g. Partiful) from static skin */
  rsvpUrl: string | null
  /** Donate path from static skin */
  donatePath: string | null
  /** Whether a DB theme record exists (vs. purely static/default) */
  hasDbTheme: boolean
  /** Whether a static (code-defined) skin was found */
  hasStaticSkin: boolean
  /** Raw ThemeData from DB (for theme editor preview re-use) */
  themeData: ThemeData | null
  /** Resolved border tokens (with defaults filled in) */
  borderTokens: Required<CampaignBorderTokens>
  /** Resolved density tokens (with defaults filled in) */
  densityTokens: Required<CampaignDensityTokens>
}

// ---------------------------------------------------------------------------
// DB query
// ---------------------------------------------------------------------------

/** Shape returned by our skin resolution query */
type CampaignSkinRow = {
  id: string
  slug: string
  name: string
  instance: { campaignRef: string | null }
  theme: {
    bgGradient: string | null
    bgDeep: string | null
    titleColor: string | null
    accentPrimary: string | null
    accentSecondary: string | null
    accentTertiary: string | null
    greenAccent: string | null
    surfaceColor: string | null
    surfaceHoverColor: string | null
    borderColor: string | null
    borderHoverColor: string | null
    textPrimary: string | null
    textSecondary: string | null
    textMuted: string | null
    ctaBg: string | null
    ctaText: string | null
    ctaHoverBg: string | null
    fontDisplayKey: string | null
    fontBodyKey: string | null
    posterImageUrl: string | null
    borderTokens: unknown
    densityTokens: unknown
    cssVarOverrides: unknown
  } | null
}

/** Prisma select for the minimal campaign + theme data we need */
const SKIN_RESOLUTION_SELECT = {
  id: true,
  slug: true,
  name: true,
  instance: {
    select: {
      campaignRef: true,
    },
  },
  theme: true,
} as const

/**
 * Fetch the campaign + theme from DB.
 * Returns null if the campaign doesn't exist.
 */
async function fetchCampaignForSkin(
  input: ResolveSkinInput,
): Promise<CampaignSkinRow | null> {
  if ('slug' in input && input.slug) {
    return db.campaign.findUnique({
      where: { slug: input.slug },
      select: SKIN_RESOLUTION_SELECT,
    }) as Promise<CampaignSkinRow | null>
  }
  return db.campaign.findUnique({
    where: { id: input.campaignId },
    select: SKIN_RESOLUTION_SELECT,
  }) as Promise<CampaignSkinRow | null>
}

// ---------------------------------------------------------------------------
// Core resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a campaign's full visual skin by loading DB theme + static skin
 * and merging through the three-layer pipeline.
 *
 * Returns null only if the campaign doesn't exist in the database.
 * For campaigns with no theme/skin, returns the default (MINIMAL_DARK) values.
 */
export async function resolveCampaignSkin(
  input: ResolveSkinInput,
): Promise<ResolvedCampaignSkin | null> {
  const campaign = await fetchCampaignForSkin(input)
  if (!campaign) return null

  // Layer 1: Static skin from code registry (keyed by instance.campaignRef)
  const campaignRef = campaign.instance?.campaignRef ?? null
  const staticSkin = getCampaignSkin(campaignRef)

  // Layer 2: DB theme record (CampaignTheme)
  const dbTheme = campaign.theme
  const themeData: ThemeData | null = dbTheme
    ? {
        bgGradient: dbTheme.bgGradient,
        bgDeep: dbTheme.bgDeep,
        titleColor: dbTheme.titleColor,
        accentPrimary: dbTheme.accentPrimary,
        accentSecondary: dbTheme.accentSecondary,
        accentTertiary: dbTheme.accentTertiary,
        greenAccent: dbTheme.greenAccent,
        surfaceColor: dbTheme.surfaceColor,
        surfaceHoverColor: dbTheme.surfaceHoverColor,
        borderColor: dbTheme.borderColor,
        borderHoverColor: dbTheme.borderHoverColor,
        textPrimary: dbTheme.textPrimary,
        textSecondary: dbTheme.textSecondary,
        textMuted: dbTheme.textMuted,
        ctaBg: dbTheme.ctaBg,
        ctaText: dbTheme.ctaText,
        ctaHoverBg: dbTheme.ctaHoverBg,
        fontDisplayKey: dbTheme.fontDisplayKey,
        fontBodyKey: dbTheme.fontBodyKey,
        posterImageUrl: dbTheme.posterImageUrl,
        borderTokens: (dbTheme.borderTokens as CampaignBorderTokens) ?? null,
        densityTokens: (dbTheme.densityTokens as CampaignDensityTokens) ?? null,
        cssVarOverrides: (dbTheme.cssVarOverrides as Record<string, string>) ?? null,
      }
    : null

  // Build the merged CSS custom properties
  const cssProperties = buildSkinVars(themeData, staticSkin)

  // Resolve font classes
  const fontDisplayClass = resolveFontClass(themeData, staticSkin)
  const fontBodyClass = resolveBodyFontClass(themeData)

  // Resolve background values (for meta tags, body styles, etc.)
  const bgGradient =
    themeData?.bgGradient ??
    (staticSkin?.cssVars['--cs-bg-gradient'] as string) ??
    DEFAULT_BG_GRADIENT

  const bgDeep =
    themeData?.bgDeep ??
    (staticSkin?.cssVars['--cs-bg-deep'] as string) ??
    '#0f0f23'

  // Resolve border tokens with defaults
  const borderTokens: Required<CampaignBorderTokens> = {
    ...DEFAULT_BORDER_TOKENS,
    ...((themeData?.borderTokens as CampaignBorderTokens) ?? {}),
  }

  // Resolve density tokens with defaults
  const densityTokens: Required<CampaignDensityTokens> = {
    ...DEFAULT_DENSITY_TOKENS,
    ...((themeData?.densityTokens as CampaignDensityTokens) ?? {}),
  }

  return {
    cssProperties,
    fontDisplayClass,
    fontBodyClass,
    bgGradient,
    bgDeep,
    displayName: staticSkin?.displayName ?? campaign.name,
    posterImageUrl: themeData?.posterImageUrl ?? null,
    rsvpUrl: staticSkin?.rsvpUrl ?? null,
    donatePath: staticSkin?.donatePath ?? null,
    hasDbTheme: !!dbTheme,
    hasStaticSkin: !!staticSkin,
    themeData,
    borderTokens,
    densityTokens,
  }
}

// ---------------------------------------------------------------------------
// Synchronous resolution (no DB) — for previews / client-side
// ---------------------------------------------------------------------------

/**
 * Resolve skin synchronously from already-loaded data.
 *
 * Use this when you already have the theme data and static skin
 * (e.g., in a client component that received them as props, or in
 * a theme editor preview).
 *
 * Same three-layer merge as resolveCampaignSkin, without the DB fetch.
 */
export function resolveCampaignSkinSync(
  themeData: ThemeData | null,
  staticSkin: CampaignSkin | null,
  meta?: {
    campaignName?: string
    posterImageUrl?: string | null
  },
): ResolvedCampaignSkin {
  const cssProperties = buildSkinVars(themeData, staticSkin)
  const fontDisplayClass = resolveFontClass(themeData, staticSkin)
  const fontBodyClass = resolveBodyFontClass(themeData)

  const bgGradient =
    themeData?.bgGradient ??
    (staticSkin?.cssVars['--cs-bg-gradient'] as string) ??
    DEFAULT_BG_GRADIENT

  const bgDeep =
    themeData?.bgDeep ??
    (staticSkin?.cssVars['--cs-bg-deep'] as string) ??
    '#0f0f23'

  const borderTokens: Required<CampaignBorderTokens> = {
    ...DEFAULT_BORDER_TOKENS,
    ...((themeData?.borderTokens as CampaignBorderTokens) ?? {}),
  }

  const densityTokens: Required<CampaignDensityTokens> = {
    ...DEFAULT_DENSITY_TOKENS,
    ...((themeData?.densityTokens as CampaignDensityTokens) ?? {}),
  }

  return {
    cssProperties,
    fontDisplayClass,
    fontBodyClass,
    bgGradient,
    bgDeep,
    displayName: staticSkin?.displayName ?? meta?.campaignName ?? null,
    posterImageUrl: themeData?.posterImageUrl ?? meta?.posterImageUrl ?? null,
    rsvpUrl: staticSkin?.rsvpUrl ?? null,
    donatePath: staticSkin?.donatePath ?? null,
    hasDbTheme: !!themeData,
    hasStaticSkin: !!staticSkin,
    themeData,
    borderTokens,
    densityTokens,
  }
}

// ---------------------------------------------------------------------------
// Default skin (no campaign context)
// ---------------------------------------------------------------------------

/**
 * Return the default resolved skin when no campaign context is available.
 *
 * Uses MINIMAL_DARK as the baseline. Useful for:
 *   - Error/fallback states
 *   - Pages that may or may not have campaign context
 *   - Preview mode with no campaign selected
 */
export function getDefaultResolvedSkin(): ResolvedCampaignSkin {
  return resolveCampaignSkinSync(MINIMAL_DARK_THEME_DATA, null, {
    campaignName: null as unknown as string,
  })
}

// ---------------------------------------------------------------------------
// CSS variable extraction helpers
// ---------------------------------------------------------------------------

/**
 * Extract only the --cs-* CSS custom properties from a resolved skin.
 *
 * Useful for serializing to a <style> tag or passing to an iframe/embed
 * where inline styles aren't practical.
 *
 * Returns a CSS declaration block string:
 *   "--cs-bg: #1a1a5e; --cs-title: #f0d000; ..."
 */
export function extractCssVarDeclarations(
  resolved: ResolvedCampaignSkin,
): string {
  const props = resolved.cssProperties as Record<string, string>
  return CAMPAIGN_CSS_VAR_KEYS
    .filter((key) => key in props)
    .map((key) => `${key}: ${props[key]}`)
    .join('; ')
}

/**
 * Generate a <style> block with campaign skin CSS custom properties
 * scoped to a given selector.
 *
 * Example output:
 *   .campaign-skin { --cs-bg: #1a1a5e; --cs-title: #f0d000; ... }
 */
export function generateScopedStyleBlock(
  resolved: ResolvedCampaignSkin,
  selector = '.campaign-skin',
): string {
  const declarations = extractCssVarDeclarations(resolved)
  return `${selector} { ${declarations} }`
}

// ---------------------------------------------------------------------------
// Self-serve integration: resolve for campaign pages (server-side)
// ---------------------------------------------------------------------------

/**
 * Resolve skin for a campaign page context — the recommended entry point
 * for server components on campaign routes.
 *
 * This handles the full resolution chain for both:
 *   - Reference campaigns with static skins (e.g. Bruised Banana)
 *   - Self-serve campaigns with DB-driven themes (wizard-created)
 *
 * Falls back to MINIMAL_DARK when no skin/theme exists. Never returns null
 * for an existing campaign — only returns null if the campaign doesn't exist.
 *
 * @param slug - Campaign slug from the URL path
 * @returns ResolvedCampaignSkin or null if campaign not found
 */
export async function resolveCampaignPageSkin(
  slug: string,
): Promise<ResolvedCampaignSkin | null> {
  return resolveCampaignSkin({ slug })
}

/**
 * Resolve a campaign skin with an inline style object ready for React.
 *
 * Returns both the resolved skin AND a pre-built `wrapperProps` object
 * that includes the `style` and `className` for the outermost wrapper div.
 *
 * Usage in Server Components:
 *   const { skin, wrapperProps } = await resolveCampaignSkinWithProps('bruised-banana')
 *   return <div {...wrapperProps}>...</div>
 */
export async function resolveCampaignSkinWithProps(
  slug: string,
): Promise<{
  skin: ResolvedCampaignSkin
  wrapperProps: {
    style: React.CSSProperties
    className: string
  }
} | null> {
  const skin = await resolveCampaignSkin({ slug })
  if (!skin) return null

  return {
    skin,
    wrapperProps: {
      style: {
        background: skin.bgGradient,
        ...skin.cssProperties,
      },
      className: [
        'min-h-screen',
        'text-[var(--cs-text-primary,#e8e6e0)]',
        skin.fontBodyClass,
      ]
        .filter(Boolean)
        .join(' '),
    },
  }
}

/**
 * Build wrapper style props from a ResolvedCampaignSkin.
 *
 * Synchronous variant for client components that already have the resolved
 * skin from props. Returns style + className for the outermost campaign wrapper.
 */
export function buildSkinWrapperProps(
  skin: ResolvedCampaignSkin,
): {
  style: React.CSSProperties
  className: string
} {
  return {
    style: {
      background: skin.bgGradient,
      ...skin.cssProperties,
    },
    className: [
      'min-h-screen',
      'text-[var(--cs-text-primary,#e8e6e0)]',
      skin.fontBodyClass,
    ]
      .filter(Boolean)
      .join(' '),
  }
}

// ---------------------------------------------------------------------------
// Serialization helpers for passing resolved skins to client components
// ---------------------------------------------------------------------------

/**
 * Serializable version of ResolvedCampaignSkin for passing as props
 * to client components. React.CSSProperties is already serializable,
 * but this type makes the contract explicit.
 */
export type SerializableCampaignSkin = {
  cssProperties: Record<string, string>
  fontDisplayClass: string
  fontBodyClass: string
  bgGradient: string
  bgDeep: string
  displayName: string | null
  posterImageUrl: string | null
  rsvpUrl: string | null
  donatePath: string | null
  hasDbTheme: boolean
  hasStaticSkin: boolean
  borderTokens: Required<CampaignBorderTokens>
  densityTokens: Required<CampaignDensityTokens>
}

/**
 * Convert a ResolvedCampaignSkin to a serializable form for client component props.
 * Strips themeData (which may contain non-serializable types) and casts
 * cssProperties to a plain Record.
 */
export function toSerializableSkin(
  resolved: ResolvedCampaignSkin,
): SerializableCampaignSkin {
  return {
    cssProperties: resolved.cssProperties as unknown as Record<string, string>,
    fontDisplayClass: resolved.fontDisplayClass,
    fontBodyClass: resolved.fontBodyClass,
    bgGradient: resolved.bgGradient,
    bgDeep: resolved.bgDeep,
    displayName: resolved.displayName,
    posterImageUrl: resolved.posterImageUrl,
    rsvpUrl: resolved.rsvpUrl,
    donatePath: resolved.donatePath,
    hasDbTheme: resolved.hasDbTheme,
    hasStaticSkin: resolved.hasStaticSkin,
    borderTokens: resolved.borderTokens,
    densityTokens: resolved.densityTokens,
  }
}
