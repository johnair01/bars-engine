'use client'

import { BarFlipCard } from './BarFlipCard'

type AssetLike = { id: string; url: string; mimeType?: string | null; metadataJson?: string | null; side?: string | null }

type BarListThumbProps = {
  assets: AssetLike[]
  className?: string
}

/**
 * Compact thumbnail for BAR list items. Uses BarFlipCard when image assets exist
 * (supports rotation and front/back flip).
 */
export function BarListThumb({ assets, className = '' }: BarListThumbProps) {
  const imageAssets = assets.filter((a) => a.mimeType?.startsWith('image/'))
  if (imageAssets.length === 0) return null

  return (
    <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-700 ${className}`}>
      <BarFlipCard assets={imageAssets} compact />
    </div>
  )
}
