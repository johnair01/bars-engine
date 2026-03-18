'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import { getQuestCyoaMeta } from '@/actions/quest-cyoa'

type Props = {
  anchor: AnchorData
  onClose: () => void
}

export function CyoaQuestModal({ anchor, onClose }: Props) {
  const router = useRouter()
  const [meta, setMeta] = useState<{ questId: string; storyId: string; title: string; description: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const questId = anchor.linkedId
    if (!questId) {
      setError('No quest linked')
      setLoading(false)
      return
    }
    getQuestCyoaMeta(questId).then((result) => {
      setLoading(false)
      if (result) setMeta(result)
      else setError('Quest has no adventure')
    })
  }, [anchor.linkedId])

  const handlePlay = () => {
    if (!meta) return
    router.push(`/adventures/${meta.storyId}/play?questId=${meta.questId}`)
    onClose()
  }

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
        <p className="text-zinc-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (error || !meta) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
        <h2 className="text-white font-bold">{anchor.label ?? 'Adventure'}</h2>
        <p className="text-zinc-400 text-sm">{error ?? 'Quest has no adventure.'}</p>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
      <div className="flex justify-between items-start">
        <h2 className="text-white font-bold">{meta.title}</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
      </div>
      {meta.description && (
        <p className="text-zinc-400 text-sm line-clamp-3">{meta.description}</p>
      )}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handlePlay}
          className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded"
        >
          Play
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded"
        >
          Abandon
        </button>
      </div>
    </div>
  )
}
