'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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

export function ExtendToQuestFlow({ barId }: { barId: string }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [suggestions, setSuggestions] = useState<QuestSuggestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadSuggestions = () => {
    if (suggestions !== null) return
    setError(null)
    startTransition(async () => {
      const result = await generateQuestSuggestionsFromCharge(barId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSuggestions(result.quest_suggestions)
    })
  }

  const handleExpand = () => {
    setExpanded(true)
    loadSuggestions()
  }

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

  return (
    <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        Extend to quest
      </h2>
      <p className="text-sm text-zinc-400 mb-4">
        Turn this BAR into an aligned quest. Choose a direction that fits.
      </p>
      {!expanded ? (
        <button
          type="button"
          onClick={handleExpand}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Generate quest suggestions
        </button>
      ) : (
        <div className="space-y-4">
          {isPending && !suggestions && (
            <p className="text-sm text-zinc-500">Loading suggestions...</p>
          )}
          {error && !suggestions && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {suggestions && suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 space-y-2"
                >
                  <span className="text-xs uppercase tracking-wider text-purple-400">
                    {MOVE_LABELS[s.move_type] ?? s.move_type}
                  </span>
                  <h3 className="font-medium text-white">{s.quest_title}</h3>
                  <p className="text-sm text-zinc-400">{s.quest_summary}</p>
                  <button
                    type="button"
                    onClick={() => handleCreateQuest(i)}
                    disabled={creatingIndex !== null}
                    className="mt-2 py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-600 disabled:text-zinc-400 text-white text-sm font-medium transition"
                  >
                    {creatingIndex === i ? 'Creating…' : 'Create quest'}
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && suggestions && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      )}
    </section>
  )
}
