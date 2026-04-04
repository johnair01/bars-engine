'use client'

/**
 * CampaignGradientFade — skin-aware gradient fade overlay.
 *
 * Reads the campaign's bgDeep color from CampaignSkinProvider and renders
 * a gradient fade from transparent to that deep background color.
 *
 * Used above sticky footers and between content sections to create
 * smooth visual transitions that respect the campaign's color scheme.
 *
 * @example Above a sticky footer
 *   <footer className="sticky bottom-0">
 *     <CampaignGradientFade direction="down" />
 *     <div className="relative">...footer content...</div>
 *   </footer>
 */

import { useCampaignSkin } from '@/lib/ui/campaign-skin-provider'

type CampaignGradientFadeProps = {
  /** Fade direction — "down" fades from transparent to bgDeep (default), "up" reverses */
  direction?: 'down' | 'up'
  /** Height of the gradient area (default: "2rem") */
  height?: string
  /** Additional className */
  className?: string
}

export function CampaignGradientFade({
  direction = 'down',
  height = '2rem',
  className,
}: CampaignGradientFadeProps) {
  const { bgDeep } = useCampaignSkin()

  const gradient =
    direction === 'down'
      ? `linear-gradient(to bottom, transparent, ${bgDeep})`
      : `linear-gradient(to top, transparent, ${bgDeep})`

  return (
    <div
      className={[
        'absolute inset-x-0 pointer-events-none',
        direction === 'down' ? '-top-8' : '-bottom-8',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: gradient,
        height,
      }}
      aria-hidden="true"
    />
  )
}
