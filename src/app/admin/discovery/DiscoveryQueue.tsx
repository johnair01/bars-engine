'use client'

import { assignQuestToPool, rejectDiscoveryQuest } from '@/actions/quest-pools'
import type { QuestPoolType, QuestSummary } from '@/actions/quest-pools'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

const POOL_OPTIONS: { value: QuestPoolType; label: string }[] = [
  { value: 'efa', label: 'EFA (Clean Up)' },
  { value: 'dojo', label: 'Dojo (Grow Up)' },
  { value: 'gameboard', label: 'Gameboard (Show Up)' },
]

export function DiscoveryQueue({ quests }: { quests: QuestSummary[] }) {
  const router = useRouter()
  const [reassigningId, setReassigningId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)

  const handleReassign = async (questId: string, pool: QuestPoolType) => {
    setReassigningId(questId)
    setActionResult(null)
    const result = await assignQuestToPool(questId, pool)
    setReassigningId(null)
    if ('error' in result) {
      setActionResult(result.error)
    } else {
      router.refresh()
    }
  }

  const handleReject = async (questId: string) => {
    if (!confirm('Archive this quest? It will be removed from the discovery pool.')) return
    setRejectingId(questId)
    setActionResult(null)
    const result = await rejectDiscoveryQuest(questId)
    setRejectingId(null)
    if ('error' in result) {
      setActionResult(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {actionResult && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3">
          <p className="text-amber-300 text-sm">{actionResult}</p>
        </div>
      )}
      <div className="space-y-3">
        {quests.map((q) => (
          <div
            key={q.id}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="min-w-0">
              <h3 className="font-medium text-white truncate">{q.title}</h3>
              {q.description && (
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{q.description}</p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {q.moveType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {MOVE_LABELS[q.moveType] ?? q.moveType}
                  </span>
                )}
                {q.allyshipDomain && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {q.allyshipDomain}
                  </span>
                )}
                {q.reward > 0 && <span className="text-xs text-zinc-500">{q.reward}ⓥ</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <select
                onChange={(e) => {
                  const pool = e.target.value as QuestPoolType
                  if (pool) handleReassign(q.id, pool)
                  e.target.value = ''
                }}
                disabled={reassigningId !== null}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                <option value="">Reassign to...</option>
                {POOL_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Link
                href={`/admin/quests/${q.id}`}
                className="px-3 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition"
              >
                Edit
              </Link>
              <button
                onClick={() => handleReject(q.id)}
                disabled={rejectingId !== null}
                className="px-3 py-2 text-sm bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded-lg transition disabled:opacity-50"
              >
                {rejectingId === q.id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
