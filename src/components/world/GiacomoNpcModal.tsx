'use client'

import Link from 'next/link'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'

type Props = {
  anchor: AnchorData
  onClose: () => void
}

/**
 * Campaign villain anchor — in-world tease; constitution / agent play is separate track.
 */
export function GiacomoNpcModal({ anchor, onClose }: Props) {
  const title = anchor.label ?? 'Giacomo'

  return (
    <div className="bg-zinc-900 border border-red-900/50 rounded-xl p-6 max-w-md w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-white font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm shrink-0">
          Close
        </button>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed">
        A shadow merchant at the edge of the order the Regent keeps. He does not sell books — he trades in
        <span className="text-red-300/90"> pressure, appetite, and the stories you tell yourself to stay small</span>.
        The Card Club tolerates him the way a forest tolerates fungus: as something to metabolize, not to obey.
      </p>
      <p className="text-zinc-500 text-xs">
        Tier-4 NPC constitution and memory live in admin / agent tooling; this room is a narrative hook.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Link
          href="/daemons"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-800/70 text-white text-sm font-medium text-center border border-red-800/50"
        >
          Daemons &amp; inner work
        </Link>
        <Link
          href="/story"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-200 hover:bg-zinc-800 text-sm font-medium text-center"
        >
          Story
        </Link>
      </div>
    </div>
  )
}
