'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getPlacementOptionsForQuest,
  addQuestToThread,
  addQuestAsSubquestToGameboard,
} from '@/actions/quest-placement'

export function PlacementModal({ questId }: { questId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [options, setOptions] = useState<{
    threads: Array<{ id: string; title: string; description: string | null }>
    gameboardSlots: Array<{
      slotQuestId: string
      slotTitle: string
      campaignRef: string
      campaignTitle: string
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPlacementOptionsForQuest(questId).then((res) => {
      setLoading(false)
      if ('error' in res) {
        setError(res.error)
      } else {
        setOptions(res)
      }
    })
  }, [questId])

  const handleClose = () => {
    setOpen(false)
    router.replace('/hand', { scroll: false })
  }

  const handleAddToThread = async (threadId: string) => {
    setPlacing(threadId)
    setError(null)
    const res = await addQuestToThread(questId, threadId)
    setPlacing(null)
    if ('error' in res) {
      setError(res.error)
    } else {
      handleClose()
      router.refresh()
    }
  }

  const handleAddToGameboard = async (slotQuestId: string) => {
    setPlacing(slotQuestId)
    setError(null)
    const res = await addQuestAsSubquestToGameboard(questId, slotQuestId)
    setPlacing(null)
    if ('error' in res) {
      setError(res.error)
    } else {
      handleClose()
      router.refresh()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white">Place your quest</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Add this quest to a thread or contribute to the campaign gameboard.
        </p>

        {loading && (
          <p className="mt-4 text-sm text-zinc-500">Loading options…</p>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-950/30 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {options && !loading && (
          <div className="mt-4 space-y-4">
            {options.threads.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Add to thread
                </h4>
                <div className="mt-2 space-y-2">
                  {options.threads.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleAddToThread(t.id)}
                      disabled={!!placing}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-left text-sm text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800/80 disabled:opacity-50"
                    >
                      {placing === t.id ? '…' : t.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {options.gameboardSlots.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Add as subquest to gameboard
                </h4>
                <div className="mt-2 space-y-2">
                  {options.gameboardSlots.slice(0, 3).map((s) => (
                    <button
                      key={s.slotQuestId}
                      onClick={() => handleAddToGameboard(s.slotQuestId)}
                      disabled={!!placing}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-left text-sm text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800/80 disabled:opacity-50"
                    >
                      {placing === s.slotQuestId ? '…' : `${s.slotTitle} (${s.campaignTitle})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {options.threads.length === 0 && options.gameboardSlots.length === 0 && (
              <p className="text-sm text-zinc-500">
                No threads or gameboard slots available. Your quest is in your Hand.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
