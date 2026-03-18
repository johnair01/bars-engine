'use client'

import Link from 'next/link'

export function HandQuestActions({ questId }: { questId: string }) {
  return (
    <div className="flex gap-2 shrink-0">
      <Link
        href={`/quest/${encodeURIComponent(questId)}/unpack`}
        className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        Unpack
      </Link>
    </div>
  )
}
