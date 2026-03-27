import type { CampaignOverlay } from '@/lib/narrative-os/types'
import { OverlayBadge } from './OverlayBadge'

type Props = {
  overlays: CampaignOverlay[]
}

/** Renders campaign injection chips for a narrative space. */
export function SpaceOverlayBadges({ overlays }: Props) {
  if (!overlays.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label="Campaign overlays">
      {overlays.map((o) => (
        <span key={o.id} role="listitem">
          <OverlayBadge label={o.title} tooltip={o.summary} />
        </span>
      ))}
    </div>
  )
}
