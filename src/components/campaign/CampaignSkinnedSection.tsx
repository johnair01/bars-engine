'use client'

/**
 * CampaignSkinnedSection — a themed surface card that respects the active campaign skin.
 *
 * Reads border tokens (altitude channel) and density tokens (stage channel) from
 * the CampaignSkinProvider context and applies them as inline styles.
 *
 * Use this for any content card within a campaign page that should honor the
 * campaign's L2 theme (border radius, glow, padding, spacing).
 *
 * @example
 *   <CampaignSkinnedSection glow>
 *     <h2 style={{ color: 'var(--cs-accent-1)' }}>The Story</h2>
 *     <p>{wakeUpContent}</p>
 *   </CampaignSkinnedSection>
 *
 * @see src/lib/ui/campaign-skin-provider.tsx — CampaignSkinProvider + useCampaignSkin
 * @see src/lib/ui/campaign-skin-tokens.ts — border/density token types
 * @see UI_COVENANT.md — three-channel encoding
 */

import type { ReactNode, CSSProperties } from 'react'
import { useCampaignSkin, campaignSurfaceStyle } from '@/lib/ui/campaign-skin-provider'

type CampaignSkinnedSectionProps = {
  children: ReactNode
  /** Enable glow effect on the surface (default: false) */
  glow?: boolean
  /** Override background color */
  background?: string
  /** Additional inline styles to merge */
  style?: CSSProperties
  /** Additional className */
  className?: string
  /** HTML element to render as (default: 'section') */
  as?: 'section' | 'div' | 'article' | 'aside'
  /** aria-labelledby for accessibility */
  'aria-labelledby'?: string
}

export function CampaignSkinnedSection({
  children,
  glow = false,
  background,
  style: styleProp,
  className,
  as: Component = 'section',
  'aria-labelledby': ariaLabelledBy,
}: CampaignSkinnedSectionProps) {
  const { borderTokens, densityTokens } = useCampaignSkin()

  const surfaceStyle = campaignSurfaceStyle(borderTokens, densityTokens, {
    glow,
    background,
  })

  return (
    <Component
      className={['rounded-xl', className].filter(Boolean).join(' ')}
      style={{ ...surfaceStyle, ...styleProp }}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </Component>
  )
}
