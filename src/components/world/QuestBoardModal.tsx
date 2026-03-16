'use client'

import { useEffect, useState } from 'react'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import { getQuestBoardItems, claimQuestFromBoard } from '@/actions/world-anchors'

type QuestItem = { id: string; title: string; description: string; type: string; reward: number }

type Props = {
  anchor: AnchorData
  playerId: string
  onClose: () => void
}

export function QuestBoardModal({ anchor, onClose }: Props) {
  const [quests, setQuests] = useState<QuestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimed, setClaimed] = useState<Set<string>>(new Set())

  useEffect(() => {
    void getQuestBoardItems(anchor.linkedId).then(items => {
      setQuests(items)
      setLoading(false)
    })
  }, [anchor.linkedId])

  async function handleClaim(questId: string) {
    setClaiming(questId)
    try {
      await claimQuestFromBoard(questId)
      setClaimed(prev => new Set(prev).add(questId))
    } catch (e) {
      console.error(e)
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold">{anchor.label ?? 'Quest Board'}</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading quests…</p>
      ) : quests.length === 0 ? (
        <p className="text-zinc-500 text-sm">No quests available.</p>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {quests.map(q => (
            <li key={q.id} className="bg-zinc-800 rounded-lg p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white text-sm font-medium">{q.title}</p>
                  <p className="text-zinc-400 text-xs mt-1">{q.description}</p>
                </div>
                <button
                  onClick={() => handleClaim(q.id)}
                  disabled={!!claiming || claimed.has(q.id)}
                  className="shrink-0 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-xs px-2 py-1 rounded"
                >
                  {claimed.has(q.id) ? 'Claimed' : claiming === q.id ? '…' : 'Claim'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
