'use client'

import Link from 'next/link'
import { PlacementDropdown } from './PlacementDropdown'

export function HandQuestActions({ questId, showPlacement = false }: { questId: string; showPlacement?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      <Link
        href={`/quest/${encodeURIComponent(questId)}/unpack`}
        className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        Unpack
      </Link>
      {showPlacement && <PlacementDropdown questId={questId} />}
    </div>
  )
}
