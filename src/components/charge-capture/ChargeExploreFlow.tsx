'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  generateQuestSuggestionsFromCharge,
  createQuestFromSuggestion,
} from '@/actions/charge-capture'
import type { QuestSuggestion } from '@/lib/charge-quest-generator'

const MOVE_LABELS: Record<string, string> = {
  wake_up: 'Wake Up',
  clean_up: 'Clean Up',
  grow_up: 'Grow Up',
  show_up: 'Show Up',
}

export function ChargeExploreFlow({ barId }: { barId: string }) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<QuestSuggestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await generateQuestSuggestionsFromCharge(barId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSuggestions(result.quest_suggestions)
    })
  }, [barId])

  const handleCreateQuest = (index: number) => {
    setCreatingIndex(index)
    setError(null)
    startTransition(async () => {
      const result = await createQuestFromSuggestion(barId, index)
      if ('error' in result) {
        setError(result.error)
        setCreatingIndex(null)
        return
      }
      router.push(`/wallet?quest=${result.questId}`)
    })
  }

  if (error && !suggestions) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-400">{error}</p>
        <Link href="/" className="text-sm text-purple-400 hover:text-purple-300">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  if (isPending && !suggestions) {
    return (
      <div className="py-8 text-center text-zinc-500">
        Loading suggestions...
      </div>
    )
  }

  if (!suggestions) return null

  return (
    <div className="space-y-4 animate-in fade-in">
      <p className="text-sm text-zinc-400">Here are a few ways this energy could move:</p>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-2"
          >
            <span className="text-xs uppercase tracking-wider text-purple-400">
              {MOVE_LABELS[s.move_type] ?? s.move_type}
            </span>
            <h3 className="font-medium text-white">{s.quest_title}</h3>
            <p className="text-sm text-zinc-400">{s.quest_summary}</p>
            <button
              onClick={() => handleCreateQuest(i)}
              disabled={creatingIndex !== null}
              className="mt-2 py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition"
            >
              {creatingIndex === i ? 'Creating...' : 'Create quest'}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Link href="/" className="block text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to dashboard
      </Link>
    </div>
  )
}
