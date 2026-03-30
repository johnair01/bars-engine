'use client'

import { CultivationCard } from '@/components/ui/CultivationCard'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'

/**
 * Renders the Face of a BAR card — image + first line teaser.
 * Used in list cards and as the "Face" view in detail.
 */
export function BarCardFace({
  description,
  imageUrl,
  className = '',
}: {
  description: string
  imageUrl?: string | null
  className?: string
}) {
  const firstLine = (description || '').trim().split(/\r?\n/)[0]?.trim() || ''
  const st = STAGE_TOKENS['seed']

  return (
    <CultivationCard
      stage="seed"
      altitude="dissatisfied"
      className={className}
    >
      <div className={`card-art-window ${st.artWindowHeight} overflow-hidden rounded-t-xl bg-black/20`}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className={`w-full h-full object-cover object-center ${st.artOpacity}`}
          />
        )}
      </div>
      <div className="p-4 relative z-10">
        <p className="font-mono text-sm text-zinc-300 line-clamp-2 break-words text-center min-h-[40px] flex items-center justify-center">
          {firstLine || description}
        </p>
      </div>
    </CultivationCard>
  )
}
