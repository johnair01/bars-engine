'use client'

import { pullFromLibraryAction } from '@/actions/quest-library'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { QuestSummary } from '@/actions/quest-pools'

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

export function EfaQuestPoolSection({ quests }: { quests: QuestSummary[] }) {
  const router = useRouter()
  const [pullingId, setPullingId] = useState<string | null>(null)

  const handlePull = (questId: string) => {
    setPullingId(questId)
    pullFromLibraryAction({ questId }).then((result) => {
      setPullingId(null)
      if ('error' in result) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  if (quests.length === 0) return null

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-lg font-semibold text-white mb-2">Learn moves</h2>
      <p className="text-sm text-zinc-500 mb-4">
        Clean Up quests that help you learn or improve at moves. Pull one to add to your journey.
      </p>
      <div className="space-y-3">
        {quests.map((q) => (
          <div
            key={q.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <div>
              <h3 className="font-medium text-white">{q.title}</h3>
              {q.description && (
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{q.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                {q.moveType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {MOVE_LABELS[q.moveType] ?? q.moveType}
                  </span>
                )}
                {q.reward > 0 && (
                  <span className="text-xs text-zinc-500">{q.reward}ⓥ</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handlePull(q.id)}
              disabled={pullingId !== null}
              className="shrink-0 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {pullingId === q.id ? 'Adding...' : 'Add to journey'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
