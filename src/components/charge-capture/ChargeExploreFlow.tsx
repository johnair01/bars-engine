'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  generateQuestSuggestionsFromCharge,
  createQuestFromSuggestion,
} from '@/actions/charge-capture'
import {
  getPlacementOptionsForQuest,
  addQuestToThread,
  addQuestAsSubquestToGameboard,
} from '@/actions/quest-placement'
import type { QuestSuggestion } from '@/lib/charge-quest-generator'
import type { PlacementOptions } from '@/actions/quest-placement'

const MOVE_LABELS: Record<string, string> = {
  wake_up: 'Wake Up',
  clean_up: 'Clean Up',
  grow_up: 'Grow Up',
  show_up: 'Show Up',
}

type Phase =
  | { kind: 'loading' }
  | { kind: 'suggestions'; items: QuestSuggestion[] }
  | { kind: 'what-now'; questId: string }
  | { kind: 'placing'; questId: string; options: PlacementOptions }
  | { kind: 'done'; questId: string }
  | { kind: 'error'; message: string }

export function ChargeExploreFlow({ barId }: { barId: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null)
  const [placingId, setPlacingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load suggestions on mount
  useEffect(() => {
    startTransition(async () => {
      const result = await generateQuestSuggestionsFromCharge(barId)
      if ('error' in result) {
        setPhase({ kind: 'error', message: result.error })
        return
      }
      setPhase({ kind: 'suggestions', items: result.quest_suggestions })
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
      // Quest created — let player choose what to do next
      setPhase({ kind: 'what-now', questId: result.questId })
      setCreatingIndex(null)
    })
  }

  const handleAddToWallet = (questId: string) => {
    startTransition(async () => {
      const opts = await getPlacementOptionsForQuest(questId)
      if ('error' in opts || (opts.threads.length === 0 && opts.gameboardSlots.length === 0)) {
        setPhase({ kind: 'done', questId })
      } else {
        setPhase({ kind: 'placing', questId, options: opts as PlacementOptions })
      }
    })
  }

  const handleAddToThread = (threadId: string) => {
    if (phase.kind !== 'placing') return
    const questId = phase.questId
    setPlacingId(threadId)
    setError(null)
    startTransition(async () => {
      const result = await addQuestToThread(questId, threadId)
      if ('error' in result) {
        setError(result.error)
      } else {
        setPhase({ kind: 'done', questId })
      }
      setPlacingId(null)
    })
  }

  const handleAddToSlot = (slotQuestId: string) => {
    if (phase.kind !== 'placing') return
    const questId = phase.questId
    setPlacingId(slotQuestId)
    setError(null)
    startTransition(async () => {
      const result = await addQuestAsSubquestToGameboard(questId, slotQuestId)
      if ('error' in result) {
        setError(result.error)
      } else {
        setPhase({ kind: 'done', questId })
      }
      setPlacingId(null)
    })
  }

  // ---- Render phases ----

  if (phase.kind === 'error') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-400">{phase.message}</p>
        <Link href="/" className="text-sm text-purple-400 hover:text-purple-300">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  if (phase.kind === 'loading') {
    return (
      <div className="py-8 text-center text-zinc-500">Loading suggestions...</div>
    )
  }

  if (phase.kind === 'what-now') {
    const { questId } = phase
    return (
      <div className="space-y-5 animate-in fade-in">
        <div className="rounded-xl border border-green-800/50 bg-green-950/20 p-5 space-y-1">
          <p className="text-green-400 font-semibold">Quest created.</p>
          <p className="text-zinc-400 text-sm">What would you like to do with it?</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/quest/${questId}/unpack`)}
            className="w-full text-left rounded-xl border border-purple-800/50 bg-purple-950/20 px-5 py-4 hover:bg-purple-900/30 transition group"
          >
            <p className="text-white font-semibold group-hover:text-purple-200 transition">Unpack this quest</p>
            <p className="text-zinc-400 text-sm mt-0.5">Walk through reflection prompts and choose your move — Wake Up, Clean Up, Grow Up, or Show Up.</p>
          </button>

          <button
            onClick={() => handleAddToWallet(questId)}
            disabled={isPending}
            className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-4 hover:bg-zinc-900 transition disabled:opacity-50"
          >
            <p className="text-white font-semibold">Add to Quest Wallet</p>
            <p className="text-zinc-400 text-sm mt-0.5">Save it and place it in a thread or gameboard slot when ready.</p>
          </button>
        </div>
      </div>
    )
  }

  if (phase.kind === 'done') {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="rounded-xl border border-green-800/50 bg-green-950/20 p-5 text-center space-y-2">
          <p className="text-green-400 font-medium">Quest created.</p>
          <p className="text-zinc-400 text-sm">It&apos;s in your Quest Wallet.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/hand"
            className="flex-1 text-center py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition"
          >
            Go to Quest Wallet →
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (phase.kind === 'placing') {
    const { options, questId } = phase
    return (
      <div className="space-y-5 animate-in fade-in">
        <div className="rounded-xl border border-green-800/50 bg-green-950/20 p-4">
          <p className="text-green-400 font-medium text-sm">Quest created.</p>
          <p className="text-zinc-400 text-xs mt-1">Where should this quest live?</p>
        </div>

        {options.threads.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500">Add to thread</h3>
            {options.threads.map((t) => (
              <button
                key={t.id}
                onClick={() => handleAddToThread(t.id)}
                disabled={isPending}
                className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 hover:border-purple-700/50 hover:bg-purple-950/20 transition disabled:opacity-50"
              >
                <p className="text-white text-sm font-medium">{t.title}</p>
                {t.description && (
                  <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{t.description}</p>
                )}
                {placingId === t.id && (
                  <p className="text-purple-400 text-xs mt-1">Adding...</p>
                )}
              </button>
            ))}
          </div>
        )}

        {options.gameboardSlots.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500">Add as subquest to gameboard</h3>
            {options.gameboardSlots.map((s) => (
              <button
                key={s.slotQuestId}
                onClick={() => handleAddToSlot(s.slotQuestId)}
                disabled={isPending}
                className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 hover:border-amber-700/50 hover:bg-amber-950/20 transition disabled:opacity-50"
              >
                <p className="text-zinc-300 text-xs uppercase tracking-wider">{s.campaignTitle}</p>
                <p className="text-white text-sm font-medium mt-0.5">{s.slotTitle}</p>
                {placingId === s.slotQuestId && (
                  <p className="text-amber-400 text-xs mt-1">Attaching...</p>
                )}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setPhase({ kind: 'done', questId })}
            className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition"
          >
            Skip — keep in wallet
          </button>
        </div>
      </div>
    )
  }

  // phase.kind === 'suggestions'
  const suggestions = phase.items
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
              disabled={creatingIndex !== null || isPending}
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
