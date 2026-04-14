'use client'
/**
 * useCampaignSkin — client-side hook for consuming resolved campaign skins.
 *
 * This hook takes a serialized campaign skin (from server component props)
 * and provides a convenient API for client components to apply campaign theming.
 *
 * It does NOT fetch from the DB — that's the server's job via resolveCampaignSkin().
 * This hook is purely a consumer of pre-resolved skin data.
 *
 * Usage:
 *   // Server component passes skin as prop
 *   const resolved = await resolveCampaignSkin({ slug })
 *   const serialized = toSerializableSkin(resolved)
 *   return <ClientComponent skin={serialized} />
 *
 *   // Client component uses the hook
 *   function ClientComponent({ skin }: { skin: SerializableCampaignSkin }) {
 *     const { wrapperProps, fontClass, vars } = useCampaignSkin(skin)
 *     return <div {...wrapperProps}><h1 className={fontClass}>...</h1></div>
 *   }
 *
 * @see src/lib/ui/resolve-campaign-skin.ts — server-side resolution
 * @see src/lib/ui/campaign-skin.ts — static skin registry
 */

import { useMemo } from 'react'
import type { SerializableCampaignSkin } from '@/lib/ui/resolve-campaign-skin'
import type { CampaignSkin } from '@/lib/ui/campaign-skin'
import { buildSkinVars, resolveFontClass, DEFAULT_BG_GRADIENT, type ThemeData } from '@/lib/ui/build-skin-vars'

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export type CampaignSkinResult = {
  /** Style + className for the outermost campaign wrapper div */
  wrapperProps: {
    style: React.CSSProperties
    className: string
  }
  /** Tailwind font class for display/heading text */
  fontDisplayClass: string
  /** Tailwind font class for body text */
  fontBodyClass: string
  /** Background gradient CSS value */
  bgGradient: string
  /** Deep background color (for meta theme, gradients) */
  bgDeep: string
  /** All resolved CSS custom properties */
  cssProperties: Record<string, string>
  /** Campaign display name */
  displayName: string | null
  /** Poster image URL if set */
  posterImageUrl: string | null
  /** Whether this campaign has a DB theme (L2 wizard path) */
  hasDbTheme: boolean
  /** Whether this campaign has a static (code-defined) skin */
  hasStaticSkin: boolean
}

// ---------------------------------------------------------------------------
// Hook (from SerializableCampaignSkin)
// ---------------------------------------------------------------------------

/**
 * Consume a pre-resolved campaign skin in a client component.
 *
 * @param skin - SerializableCampaignSkin from server props
 * @returns Convenience accessors for applying the skin to React elements
 */
export function useCampaignSkin(
  skin: SerializableCampaignSkin | null,
): CampaignSkinResult {
  return useMemo(() => {
    if (!skin) {
      return {
        wrapperProps: {
          style: { background: DEFAULT_BG_GRADIENT } as React.CSSProperties,
          className: 'min-h-screen text-[var(--cs-text-primary,#e8e6e0)]',
        },
        fontDisplayClass: '',
        fontBodyClass: '',
        bgGradient: DEFAULT_BG_GRADIENT,
        bgDeep: '#0f0f23',
        cssProperties: {},
        displayName: null,
        posterImageUrl: null,
        hasDbTheme: false,
        hasStaticSkin: false,
      }
    }

    return {
      wrapperProps: {
        style: {
          background: skin.bgGradient,
          ...skin.cssProperties,
        } as React.CSSProperties,
        className: [
          'min-h-screen',
          'text-[var(--cs-text-primary,#e8e6e0)]',
          skin.fontBodyClass,
        ]
          .filter(Boolean)
          .join(' '),
      },
      fontDisplayClass: skin.fontDisplayClass,
      fontBodyClass: skin.fontBodyClass,
      bgGradient: skin.bgGradient,
      bgDeep: skin.bgDeep,
      cssProperties: skin.cssProperties,
      displayName: skin.displayName,
      posterImageUrl: skin.posterImageUrl,
      hasDbTheme: skin.hasDbTheme,
      hasStaticSkin: skin.hasStaticSkin,
    }
  }, [skin])
}

// ---------------------------------------------------------------------------
// Legacy hook (from ThemeData + CampaignSkin directly)
// ---------------------------------------------------------------------------

/**
 * Consume campaign skin from raw ThemeData + static CampaignSkin.
 *
 * This is the legacy pattern used by existing components that receive
 * theme data and static skin as separate props. New components should
 * prefer `useCampaignSkin()` with SerializableCampaignSkin.
 *
 * @param themeData - ThemeData from DB (or null)
 * @param staticSkin - Static CampaignSkin (or null)
 * @returns Convenience accessors for applying the skin
 */
export function useCampaignSkinLegacy(
  themeData: ThemeData | null,
  staticSkin: CampaignSkin | null,
): {
  skinVars: React.CSSProperties
  fontClass: string
  bgGradient: string
  bgDeep: string
  wrapperStyle: React.CSSProperties
} {
  return useMemo(() => {
    const skinVars = buildSkinVars(themeData, staticSkin)
    const fontClass = resolveFontClass(themeData, staticSkin)
    const bgGradient =
      (skinVars as Record<string, string>)['--cs-bg-gradient'] ?? DEFAULT_BG_GRADIENT
    const bgDeep =
      (skinVars as Record<string, string>)['--cs-bg-deep'] ?? '#0f0f23'

    return {
      skinVars,
      fontClass,
      bgGradient,
      bgDeep,
      wrapperStyle: {
        background: bgGradient,
        ...skinVars,
      },
    }
  }, [themeData, staticSkin])
}
