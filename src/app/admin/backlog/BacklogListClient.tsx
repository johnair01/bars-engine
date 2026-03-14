'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { assignBacklogItemOwner } from '@/actions/backlog'
import { GAME_MASTER_FACES, type GameMasterFace } from '@/lib/quest-grammar/types'

type Item = {
  id: string
  priority: number
  featureName: string
  link: string | null
  category: string
  status: string
  ownerFace: string | null
}

const FACE_LABELS: Record<GameMasterFace, string> = {
  shaman: 'Shaman',
  challenger: 'Challenger',
  regent: 'Regent',
  architect: 'Architect',
  diplomat: 'Diplomat',
  sage: 'Sage',
}

export function BacklogListClient({ items, initialOwnerFace }: { items: Item[]; initialOwnerFace?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ownerFilter, setOwnerFilter] = useState<string>(initialOwnerFace ?? '')

  useEffect(() => {
    setOwnerFilter(initialOwnerFace ?? '')
  }, [initialOwnerFace])

  const handleAssign = (itemId: string, face: GameMasterFace | null) => {
    startTransition(async () => {
      await assignBacklogItemOwner(itemId, face)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        <label className="text-sm text-zinc-400">Filter by owner:</label>
        <select
          value={ownerFilter}
          onChange={(e) => {
            setOwnerFilter(e.target.value)
            const params = new URLSearchParams()
            if (e.target.value) params.set('ownerFace', e.target.value)
            router.push(`/admin/backlog${params.toString() ? `?${params}` : ''}`)
          }}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="">All</option>
          {GAME_MASTER_FACES.map((f) => (
            <option key={f} value={f}>
              {FACE_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="font-medium text-white truncate">{item.featureName}</div>
              <div className="flex gap-2 mt-1 text-xs text-zinc-500">
                <span>{item.id}</span>
                <span>·</span>
                <span>{item.category}</span>
                <span>·</span>
                <span>{item.status}</span>
                {item.ownerFace && (
                  <>
                    <span>·</span>
                    <span className="text-purple-400">{FACE_LABELS[item.ownerFace as GameMasterFace] ?? item.ownerFace}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Owner:</span>
              <select
                value={item.ownerFace ?? ''}
                onChange={(e) => handleAssign(item.id, (e.target.value || null) as GameMasterFace | null)}
                disabled={isPending}
                className="bg-black border border-zinc-700 rounded-lg px-2 py-1 text-white text-sm disabled:opacity-50"
              >
                <option value="">—</option>
                {GAME_MASTER_FACES.map((f) => (
                  <option key={f} value={f}>
                    {FACE_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-zinc-500 text-sm italic py-8 text-center">
          No backlog items. Run <code className="bg-zinc-800 px-1 rounded">npm run backlog:seed</code> to sync from BACKLOG.md.
        </div>
      )}
    </div>
  )
}
