'use client'

/**
 * BARS ENGINE — CampaignSkinProvider
 *
 * Broadcasts the resolved campaign skin to all descendant components via
 * React context. Analogous to NationProvider but for campaign-level theming.
 *
 * Design law:
 *  - Server-fed only: resolved skin flows in as RSC props, never fetched on the client.
 *  - CSS custom properties injected on a wrapper <div> so all descendants
 *    can use var(--cs-*) without prop drilling.
 *  - Consumers use useCampaignSkin() hook — returns the full resolved skin.
 *  - Follows the three-channel encoding: Element (color), Altitude (border), Stage (density).
 *
 * Usage (RSC layout or page):
 *   const skin = await resolveCampaignSkin({ slug })
 *   <CampaignSkinProvider skin={toSerializableSkin(skin)}>
 *     {children}
 *   </CampaignSkinProvider>
 *
 * Usage (client component):
 *   const { skin, fontDisplayClass, borderTokens } = useCampaignSkin()
 *
 * @see src/lib/ui/resolve-campaign-skin.ts — skin resolution pipeline
 * @see src/lib/ui/nation-provider.tsx — parallel pattern for player nation theming
 * @see UI_COVENANT.md — three-channel encoding system
 */

import { createContext, useContext, useMemo, type ReactNode, type CSSProperties } from 'react'
import type { SerializableCampaignSkin } from './resolve-campaign-skin'
import type { CampaignBorderTokens, CampaignDensityTokens } from './campaign-skin-tokens'
import { DEFAULT_BORDER_TOKENS, DEFAULT_DENSITY_TOKENS } from './campaign-skin-tokens'
import { DEFAULT_BG_GRADIENT } from './build-skin-vars'

// ─── Context Shape ────────────────────────────────────────────────────────────

export interface CampaignSkinContextValue {
  /** The full resolved skin (CSS properties, font classes, tokens, etc.) */
  skin: SerializableCampaignSkin
  /** CSS custom properties object — spread onto any element's style prop */
  cssProperties: CSSProperties
  /** Tailwind class for display/heading font */
  fontDisplayClass: string
  /** Tailwind class for body text font */
  fontBodyClass: string
  /** Background gradient CSS value */
  bgGradient: string
  /** Deep background color (for meta theme-color, gradient fades) */
  bgDeep: string
  /** Resolved border tokens (altitude channel) */
  borderTokens: Required<CampaignBorderTokens>
  /** Resolved density tokens (stage channel) */
  densityTokens: Required<CampaignDensityTokens>
  /** Whether a DB-driven theme is active (vs. defaults only) */
  hasCustomTheme: boolean
  /** Campaign display name */
  displayName: string | null
  /** Poster/banner image URL if set */
  posterImageUrl: string | null
}

const DEFAULT_SKIN: SerializableCampaignSkin = {
  cssProperties: {},
  fontDisplayClass: '',
  fontBodyClass: '',
  bgGradient: DEFAULT_BG_GRADIENT,
  bgDeep: '#0f0f23',
  displayName: null,
  posterImageUrl: null,
  rsvpUrl: null,
  donatePath: null,
  hasDbTheme: false,
  hasStaticSkin: false,
  borderTokens: DEFAULT_BORDER_TOKENS,
  densityTokens: DEFAULT_DENSITY_TOKENS,
}

const CampaignSkinContext = createContext<CampaignSkinContextValue>({
  skin: DEFAULT_SKIN,
  cssProperties: {},
  fontDisplayClass: '',
  fontBodyClass: '',
  bgGradient: DEFAULT_BG_GRADIENT,
  bgDeep: '#0f0f23',
  borderTokens: DEFAULT_BORDER_TOKENS,
  densityTokens: DEFAULT_DENSITY_TOKENS,
  hasCustomTheme: false,
  displayName: null,
  posterImageUrl: null,
})

// ─── Provider Props ───────────────────────────────────────────────────────────

export interface CampaignSkinProviderProps {
  /**
   * Serializable campaign skin from server-side resolution.
   * Use toSerializableSkin(resolved) to convert from ResolvedCampaignSkin.
   * Pass null for no campaign context (uses minimal dark defaults).
   */
  skin: SerializableCampaignSkin | null
  /**
   * When true, renders the CSS custom properties on a wrapper <div>
   * with min-h-screen and background gradient applied.
   * When false, only provides context — no wrapper element rendered.
   *
   * Use applyWrapper={true} (default) for layout-level usage.
   * Use applyWrapper={false} when you want to apply styles manually.
   */
  applyWrapper?: boolean
  /**
   * Additional className for the wrapper div (only when applyWrapper={true}).
   */
  className?: string
  children: ReactNode
}

// ─── Provider Component ───────────────────────────────────────────────────────

/**
 * CampaignSkinProvider wraps campaign routes and makes the resolved skin
 * available to all client components in the subtree.
 *
 * Two modes:
 *
 * 1. **Wrapper mode** (default, applyWrapper={true}):
 *    Renders a <div> with CSS custom properties, background gradient,
 *    min-h-screen, and body font class applied. Children inherit all
 *    --cs-* variables automatically.
 *
 * 2. **Context-only mode** (applyWrapper={false}):
 *    Only provides the React context. The consuming component is
 *    responsible for applying styles (e.g., via buildSkinWrapperProps).
 *
 * @example Layout-level usage (wrapper mode)
 *   const skin = await resolveCampaignSkin({ slug })
 *   return (
 *     <CampaignSkinProvider skin={toSerializableSkin(skin)}>
 *       {children}
 *     </CampaignSkinProvider>
 *   )
 *
 * @example Component-level usage (context-only)
 *   <CampaignSkinProvider skin={skinProp} applyWrapper={false}>
 *     <CustomWrapper>{children}</CustomWrapper>
 *   </CampaignSkinProvider>
 */
export function CampaignSkinProvider({
  skin: skinProp,
  applyWrapper = true,
  className,
  children,
}: CampaignSkinProviderProps) {
  const skin = skinProp ?? DEFAULT_SKIN

  const value = useMemo<CampaignSkinContextValue>(
    () => ({
      skin,
      cssProperties: skin.cssProperties as unknown as CSSProperties,
      fontDisplayClass: skin.fontDisplayClass,
      fontBodyClass: skin.fontBodyClass,
      bgGradient: skin.bgGradient,
      bgDeep: skin.bgDeep,
      borderTokens: skin.borderTokens,
      densityTokens: skin.densityTokens,
      hasCustomTheme: skin.hasDbTheme || skin.hasStaticSkin,
      displayName: skin.displayName,
      posterImageUrl: skin.posterImageUrl,
    }),
    [skin],
  )

  if (applyWrapper) {
    const wrapperClassName = [
      'campaign-skin',
      'min-h-screen',
      'text-[var(--cs-text-primary,#e8e6e0)]',
      skin.fontBodyClass,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <CampaignSkinContext.Provider value={value}>
        <div
          className={wrapperClassName}
          style={{
            background: skin.bgGradient,
            ...skin.cssProperties as CSSProperties,
          }}
        >
          {children}
        </div>
      </CampaignSkinContext.Provider>
    )
  }

  return (
    <CampaignSkinContext.Provider value={value}>
      {children}
    </CampaignSkinContext.Provider>
  )
}

// ─── Consumer Hook ────────────────────────────────────────────────────────────

/**
 * useCampaignSkin — access the current campaign's resolved skin.
 *
 * Returns the full skin context including CSS properties, font classes,
 * border tokens (altitude), and density tokens (stage).
 *
 * Components should degrade gracefully when no campaign skin is active
 * (hasCustomTheme === false means defaults are in use).
 *
 * @example Reading campaign skin in a client component
 *   const { fontDisplayClass, bgDeep, borderTokens } = useCampaignSkin()
 *   return (
 *     <h1 className={fontDisplayClass} style={{ color: 'var(--cs-title)' }}>
 *       {title}
 *     </h1>
 *   )
 *
 * @example Gradient fade using bgDeep
 *   const { bgDeep } = useCampaignSkin()
 *   return (
 *     <div style={{
 *       background: `linear-gradient(to bottom, transparent, ${bgDeep})`
 *     }} />
 *   )
 */
export function useCampaignSkin(): CampaignSkinContextValue {
  return useContext(CampaignSkinContext)
}

// ─── Helper: Skin-Aware Surface Styles ────────────────────────────────────────

/**
 * Generate surface card styles respecting the campaign skin's
 * border tokens (altitude channel) and density tokens (stage channel).
 *
 * Returns a CSSProperties object ready to spread onto a card/surface element.
 *
 * @example
 *   const { borderTokens, densityTokens } = useCampaignSkin()
 *   const surfaceStyle = campaignSurfaceStyle(borderTokens, densityTokens)
 *   return <div style={surfaceStyle}>...</div>
 */
export function campaignSurfaceStyle(
  borderTokens: Required<CampaignBorderTokens>,
  densityTokens: Required<CampaignDensityTokens>,
  options?: {
    /** Enable glow effect (default: false) */
    glow?: boolean
    /** Override surface background */
    background?: string
  },
): CSSProperties {
  const { borderRadius, borderWidth, glowRadius, glowColor } = borderTokens
  const { cardPadding } = densityTokens
  const glow = options?.glow ?? false

  return {
    background: options?.background ?? 'var(--cs-surface, rgba(10, 10, 40, 0.6))',
    border: `${borderWidth} solid var(--cs-border, rgba(200, 160, 255, 0.15))`,
    borderRadius,
    padding: cardPadding,
    ...(glow && glowRadius !== '0px'
      ? { boxShadow: `0 0 ${glowRadius} ${glowColor}` }
      : {}),
  }
}
