'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getPlacementOptionsForQuest,
  addQuestToThread,
  addQuestAsSubquestToGameboard,
} from '@/actions/quest-placement'

export function PlacementDropdown({ questId }: { questId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<{
    threads: Array<{ id: string; title: string }>
    gameboardSlots: Array<{ slotQuestId: string; slotTitle: string; campaignTitle: string }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [placing, setPlacing] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getPlacementOptionsForQuest(questId).then((res) => {
      setLoading(false)
      if ('error' in res) {
        setOptions({ threads: [], gameboardSlots: [] })
      } else {
        setOptions({
          threads: res.threads.slice(0, 3).map((t) => ({ id: t.id, title: t.title })),
          gameboardSlots: res.gameboardSlots.slice(0, 3).map((s) => ({
            slotQuestId: s.slotQuestId,
            slotTitle: s.slotTitle,
            campaignTitle: s.campaignTitle,
          })),
        })
      }
    })
  }, [questId, open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleAddToThread = async (threadId: string) => {
    setPlacing(threadId)
    const res = await addQuestToThread(questId, threadId)
    setPlacing(null)
    setOpen(false)
    if (!('error' in res)) router.refresh()
  }

  const handleAddToGameboard = async (slotQuestId: string) => {
    setPlacing(slotQuestId)
    const res = await addQuestAsSubquestToGameboard(questId, slotQuestId)
    setPlacing(null)
    setOpen(false)
    if (!('error' in res)) router.refresh()
  }

  const hasOptions = options && (options.threads.length > 0 || options.gameboardSlots.length > 0)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs px-2 py-1 rounded border border-amber-700/60 text-amber-400 hover:text-amber-300 hover:border-amber-600/60 transition-colors"
      >
        Place elsewhere
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-900 py-2 shadow-xl">
          {loading && (
            <div className="px-3 py-2 text-xs text-zinc-500">Loading…</div>
          )}
          {options && !loading && (
            <>
              {options.threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleAddToThread(t.id)}
                  disabled={!!placing}
                  className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {placing === t.id ? '…' : `→ Thread: ${t.title}`}
                </button>
              ))}
              {options.gameboardSlots.map((s) => (
                <button
                  key={s.slotQuestId}
                  onClick={() => handleAddToGameboard(s.slotQuestId)}
                  disabled={!!placing}
                  className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {placing === s.slotQuestId ? '…' : `→ Gameboard: ${s.slotTitle}`}
                </button>
              ))}
              {!hasOptions && (
                <div className="px-3 py-2 text-xs text-zinc-500">No options available</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
