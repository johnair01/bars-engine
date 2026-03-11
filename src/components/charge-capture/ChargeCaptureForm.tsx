'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createChargeBar,
  generateQuestSuggestionsFromCharge,
  createQuestFromSuggestion,
} from '@/actions/charge-capture'
import type { CreateChargeBarPayload } from '@/actions/charge-capture'
import type { QuestSuggestion } from '@/lib/charge-quest-generator'

const EMOTION_OPTIONS: Array<{ value: CreateChargeBarPayload['emotion_channel']; label: string }> = [
  { value: 'anger', label: 'Anger' },
  { value: 'joy', label: 'Joy' },
  { value: 'sadness', label: 'Sadness' },
  { value: 'fear', label: 'Fear' },
  { value: 'neutrality', label: 'Neutral' },
]

const MOVE_LABELS: Record<string, string> = {
  wake_up: 'Wake Up',
  clean_up: 'Clean Up',
  grow_up: 'Grow Up',
  show_up: 'Show Up',
}

export function ChargeCaptureForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [summary, setSummary] = useState('')
  const [emotion, setEmotion] = useState<CreateChargeBarPayload['emotion_channel']>()
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5 | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [capturedId, setCapturedId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<QuestSuggestion[] | null>(null)
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!summary.trim()) {
      setError('Say what feels charged')
      return
    }

    startTransition(async () => {
      const result = await createChargeBar({
        summary: summary.trim(),
        emotion_channel: emotion,
        intensity,
      })

      if ('error' in result) {
        setError(result.error)
        return
      }
      setCapturedId(result.barId)
    })
  }

  const handleExplore = () => {
    if (!capturedId) return
    setError(null)
    startTransition(async () => {
      const result = await generateQuestSuggestionsFromCharge(capturedId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSuggestions(result.quest_suggestions)
    })
  }

  const handleCreateQuest = (index: number) => {
    if (!capturedId) return
    setCreatingIndex(index)
    setError(null)
    startTransition(async () => {
      const result = await createQuestFromSuggestion(capturedId, index)
      if ('error' in result) {
        setError(result.error)
        setCreatingIndex(null)
        return
      }
      router.push(`/wallet?quest=${result.questId}`)
    })
  }

  if (capturedId && suggestions) {
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
        <button
          onClick={() => setSuggestions(null)}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back
        </button>
      </div>
    )
  }

  if (capturedId) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="rounded-xl border border-green-500/30 bg-green-950/20 p-4 text-green-100">
          Charge captured.
        </div>
        <p className="text-sm text-zinc-400">What would you like to do with it?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push(`/shadow/321?chargeBarId=${capturedId}`)}
            className="py-3 px-4 rounded-xl border border-purple-500/50 bg-purple-950/30 text-purple-200 hover:bg-purple-900/40 transition text-sm font-medium"
          >
            Reflect (321)
          </button>
          <button
            onClick={handleExplore}
            disabled={isPending}
            className="py-3 px-4 rounded-xl border border-amber-500/50 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40 transition text-sm font-medium disabled:opacity-50"
          >
            {isPending ? 'Loading...' : 'Explore'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="col-span-2 py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 transition text-sm font-medium"
          >
            Not now
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="e.g. Housing costs crushing me"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:border-purple-500 outline-none"
          autoFocus
          maxLength={200}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {EMOTION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setEmotion(emotion === opt.value ? undefined : opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              emotion === opt.value
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Intensity:</span>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setIntensity(intensity === n ? undefined : n)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
              intensity === n
                ? 'bg-amber-600 text-black'
                : 'bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition"
      >
        {isPending ? 'Capturing...' : 'Capture'}
      </button>
    </form>
  )
}
