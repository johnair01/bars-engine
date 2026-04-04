/**
 * Build CSS custom properties from a campaign theme + static skin.
 *
 * Three-layer theming (lowest → highest priority):
 *   1. Static skin (getCampaignSkin) — code-defined baseline
 *   2. Database theme (CampaignTheme typed columns) — L2 wizard overrides
 *   3. cssVarOverrides — highest priority (power-user JSON blob)
 *
 * Shared between CampaignLanding, ShareableCampaignPage, and any
 * future campaign-facing surfaces.
 *
 * @see src/lib/ui/campaign-skin-tokens.ts — JSON field type definitions
 * @see UI_COVENANT.md — three-channel encoding system
 */

import type { CampaignSkin } from './campaign-skin'
import type { CampaignBorderTokens, CampaignDensityTokens } from './campaign-skin-tokens'

/**
 * Theme data shape — accepts both full CampaignTheme records and
 * narrow Prisma selects. All fields are optional so consumers that
 * only select a subset of theme columns still type-check.
 * buildSkinVars guards every field with `if (theme.xxx)`.
 */
export type ThemeData = {
  // ─── Background ──────────────────────────────
  bgGradient?: string | null
  bgDeep?: string | null
  // ─── Color Palette ───────────────────────────
  titleColor?: string | null
  accentPrimary?: string | null
  accentSecondary?: string | null
  accentTertiary?: string | null
  greenAccent?: string | null
  // ─── Surface Colors ──────────────────────────
  surfaceColor?: string | null
  surfaceHoverColor?: string | null
  // ─── Border Colors ───────────────────────────
  borderColor?: string | null
  borderHoverColor?: string | null
  // ─── Text Colors ─────────────────────────────
  textPrimary?: string | null
  textSecondary?: string | null
  textMuted?: string | null
  // ─── CTA Tokens ──────────────────────────────
  ctaBg?: string | null
  ctaText?: string | null
  ctaHoverBg?: string | null
  // ─── Typography ──────────────────────────────
  fontDisplayKey?: string | null
  fontBodyKey?: string | null
  // ─── Visual Assets ───────────────────────────
  posterImageUrl?: string | null
  // ─── Three-Channel Encoding (Json) ───────────
  borderTokens?: CampaignBorderTokens | null
  densityTokens?: CampaignDensityTokens | null
  // ─── Override Layer ──────────────────────────
  cssVarOverrides?: Record<string, string> | null
}

/**
 * Merge static skin CSS vars with DB theme overrides.
 * Returns a CSSProperties object to spread onto a wrapper's style prop.
 *
 * Precedence: staticSkin.cssVars → typed column overrides → borderTokens/densityTokens → cssVarOverrides
 */
export function buildSkinVars(
  theme: ThemeData | null | undefined,
  staticSkin: CampaignSkin | null,
): React.CSSProperties {
  const base = staticSkin?.cssVars ?? {}

  // Layer 2: DB theme typed columns override static skin values
  const overrides: Record<string, string> = {}
  if (theme) {
    // Background
    if (theme.bgGradient) overrides['--cs-bg-gradient'] = theme.bgGradient
    if (theme.bgDeep) overrides['--cs-bg-deep'] = theme.bgDeep
    // Color palette
    if (theme.titleColor) overrides['--cs-title'] = theme.titleColor
    if (theme.accentPrimary) overrides['--cs-accent-1'] = theme.accentPrimary
    if (theme.accentSecondary) overrides['--cs-accent-2'] = theme.accentSecondary
    if (theme.accentTertiary) overrides['--cs-accent-3'] = theme.accentTertiary
    if (theme.greenAccent) overrides['--cs-green'] = theme.greenAccent
    // Surface colors
    if (theme.surfaceColor) overrides['--cs-surface'] = theme.surfaceColor
    if (theme.surfaceHoverColor) overrides['--cs-surface-hover'] = theme.surfaceHoverColor
    // Border colors
    if (theme.borderColor) overrides['--cs-border'] = theme.borderColor
    if (theme.borderHoverColor) overrides['--cs-border-hover'] = theme.borderHoverColor
    // Text colors
    if (theme.textPrimary) overrides['--cs-text-primary'] = theme.textPrimary
    if (theme.textSecondary) overrides['--cs-text-secondary'] = theme.textSecondary
    if (theme.textMuted) overrides['--cs-text-muted'] = theme.textMuted
    // CTA tokens
    if (theme.ctaBg) overrides['--cs-cta-bg'] = theme.ctaBg
    if (theme.ctaText) overrides['--cs-cta-text'] = theme.ctaText
    if (theme.ctaHoverBg) overrides['--cs-cta-hover'] = theme.ctaHoverBg

    // Channel 2: Border / altitude tokens (from Json field)
    if (theme.borderTokens) {
      const bt = theme.borderTokens
      if (bt.borderRadius) overrides['--cs-border-radius'] = bt.borderRadius
      if (bt.borderWidth) overrides['--cs-border-width'] = bt.borderWidth
      if (bt.glowRadius) overrides['--cs-glow-radius'] = bt.glowRadius
      if (bt.glowColor) overrides['--cs-glow-color'] = bt.glowColor
    }

    // Channel 3: Density / stage tokens (from Json field)
    if (theme.densityTokens) {
      const dt = theme.densityTokens
      if (dt.cardPadding) overrides['--cs-card-padding'] = dt.cardPadding
      if (dt.sectionSpacing) overrides['--cs-section-spacing'] = dt.sectionSpacing
      // contentDensity is semantic — map to concrete values
      if (dt.contentDensity) {
        overrides['--cs-content-density'] = dt.contentDensity
      }
    }

    // Layer 3: Spread full cssVarOverrides last (highest priority)
    if (theme.cssVarOverrides) {
      Object.assign(overrides, theme.cssVarOverrides)
    }
  }

  return { ...base, ...overrides } as React.CSSProperties
}

/**
 * Resolve the font class for campaign display headings.
 * DB fontDisplayKey overrides static skin fontClass.
 */
export function resolveFontClass(
  theme: ThemeData | null | undefined,
  staticSkin: CampaignSkin | null,
): string {
  if (theme?.fontDisplayKey) return `font-${theme.fontDisplayKey}`
  return staticSkin?.fontClass ?? ''
}

/**
 * Resolve the font class for campaign body text.
 * Returns empty string if no body font configured (falls back to default).
 */
export function resolveBodyFontClass(
  theme: ThemeData | null | undefined,
): string {
  if (theme?.fontBodyKey) return `font-${theme.fontBodyKey}`
  return ''
}

/** Default gradient when no skin or theme is available */
export const DEFAULT_BG_GRADIENT =
  'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
