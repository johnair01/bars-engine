'use client'

import Link from 'next/link'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import type { SpokeState } from '@/actions/campaign-spoke-states'

type Props = {
  anchor: AnchorData
  spokeState: SpokeState | null
  onClose: () => void
}

const SEED_LABEL: Record<string, string> = {
  sprout: '🌱 Sprout',
  sapling: '🌿 Sapling',
  plant: '🪴 Plant',
  tree: '🌳 Tree',
}

export function SpokePortalModal({ anchor, spokeState, onClose }: Props) {
  // Parse config from anchor to get campaignRef + spokeIndex fallback
  let campaignRef = 'bruised-banana'
  let spokeIndex = spokeState?.spokeIndex ?? 0
  if (anchor.config) {
    try {
      const cfg = JSON.parse(anchor.config) as { spokeIndex?: number; campaignRef?: string }
      if (cfg.campaignRef) campaignRef = cfg.campaignRef
      if (typeof cfg.spokeIndex === 'number') spokeIndex = cfg.spokeIndex
    } catch { /* ignore */ }
  }

  const cyoaHref = `/campaign/spoke/${spokeIndex}?ref=${encodeURIComponent(campaignRef)}`
  const landingHref = `/campaign/landing?ref=${encodeURIComponent(campaignRef)}&spoke=${spokeIndex}`

  const isLocked = spokeState?.isLocked ?? spokeIndex > 1
  const hexagramId = spokeState?.hexagramId
  const primaryFace = spokeState?.primaryFace
  const seedBarId = spokeState?.seedBarId
  const label = anchor.label ?? `Portal ${spokeIndex + 1}`

  function handleNavigateAway() {
    onClose()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-purple-400">
          Spoke {spokeIndex + 1} of 8
        </p>
        <h2 className="text-white font-bold text-lg leading-snug">{label}</h2>
        {hexagramId && (
          <p className="text-xs text-zinc-400">
            Hexagram {hexagramId}
            {primaryFace ? ` · ${primaryFace}` : ''}
          </p>
        )}
      </div>

      {/* Seed state */}
      {seedBarId ? (
        <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/40 px-4 py-3">
          <p className="text-xs text-emerald-400 font-medium">
            {SEED_LABEL['sprout']} — seed planted
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Keep watering to grow it into a quest.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 px-4 py-3">
          <p className="text-xs text-zinc-500">No seed planted yet.</p>
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-2 pt-1">
        {isLocked ? (
          <div className="w-full py-3 rounded-xl bg-zinc-800 text-center text-zinc-500 text-sm">
            🔒 Locked — unlocks as the campaign advances
          </div>
        ) : (
          <>
            <Link
              href={landingHref}
              onClick={handleNavigateAway}
              className="block w-full py-3 text-center bg-amber-700/90 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors text-sm"
            >
              Landing card first →
            </Link>
            <Link
              href={cyoaHref}
              onClick={handleNavigateAway}
              className="block w-full py-2.5 text-center bg-purple-600/90 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors text-sm"
            >
              Enter CYOA directly →
            </Link>
          </>
        )}
        <button
          onClick={onClose}
          className="block w-full text-center py-2 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
