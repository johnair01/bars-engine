'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createChargeBar,
  generateQuestSuggestionsFromCharge,
  createQuestFromSuggestion,
} from '@/actions/charge-capture'
import type { CreateChargeBarPayload, ChargeExploreCeremony } from '@/actions/charge-capture'
import { TransitionCeremony } from '@/components/charge-capture/TransitionCeremony'
import type { QuestSuggestion } from '@/lib/charge-quest-generator'

const EMOTION_OPTIONS: Array<{ value: CreateChargeBarPayload['emotion_channel']; label: string }> = [
  { value: 'anger', label: 'Anger' },
  { value: 'joy', label: 'Joy' },
  { value: 'sadness', label: 'Sadness' },
  { value: 'fear', label: 'Fear' },
  { value: 'neutrality', label: 'Neutral' },
]

const SATISFACTION_OPTIONS: Array<{
  value: NonNullable<CreateChargeBarPayload['satisfaction']>
  label: string
  color: string
  active: string
}> = [
  { value: 'dissatisfied', label: 'Dissatisfied', color: 'border-zinc-700 text-zinc-400', active: 'border-red-500 bg-red-950/40 text-red-300' },
  { value: 'neutral', label: 'Neutral', color: 'border-zinc-700 text-zinc-400', active: 'border-yellow-500 bg-yellow-950/40 text-yellow-300' },
  { value: 'satisfied', label: 'Satisfied', color: 'border-zinc-700 text-zinc-400', active: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
]

type ChargeCaptureFormProps = {
  hasChargedToday?: boolean
  todayCharge?: { id: string; title: string; description: string; createdAt: string } | null
}

const MOVE_LABELS: Record<string, string> = {
  wake_up: 'Wake Up',
  clean_up: 'Clean Up',
  grow_up: 'Grow Up',
  show_up: 'Show Up',
}

type CapturedCharge = { id: string; title: string }

function useFormState() {
  const [summary, setSummary] = useState('')
  const [emotion, setEmotion] = useState<CreateChargeBarPayload['emotion_channel']>()
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5 | undefined>()
  const [satisfaction, setSatisfaction] = useState<CreateChargeBarPayload['satisfaction']>()

  const reset = () => {
    setSummary('')
    setEmotion(undefined)
    setIntensity(undefined)
    setSatisfaction(undefined)
  }

  return { summary, setSummary, emotion, setEmotion, intensity, setIntensity, satisfaction, setSatisfaction, reset }
}

export function ChargeCaptureForm({ hasChargedToday = false, todayCharge }: ChargeCaptureFormProps = {}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const form = useFormState()
  const [error, setError] = useState<string | null>(null)
  const [captured, setCaptured] = useState<CapturedCharge[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<QuestSuggestion[] | null>(null)
  const [ceremony, setCeremony] = useState<ChargeExploreCeremony | null>(null)
  const [pendingSuggestions, setPendingSuggestions] = useState<QuestSuggestion[] | null>(null)
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.summary.trim()) {
      setError('Say what feels charged')
      return
    }

    startTransition(async () => {
      const result = await createChargeBar({
        summary: form.summary.trim(),
        emotion_channel: form.emotion,
        intensity: form.intensity,
        satisfaction: form.satisfaction,
      })

      if ('error' in result) {
        setError(result.error)
        return
      }

      form.reset()
      router.refresh()
    })
  }

  const handleExplore = (barId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await generateQuestSuggestionsFromCharge(barId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setActiveId(barId)
      setCeremony(result.ceremony)
      setPendingSuggestions(result.quest_suggestions)
    })
  }

  const handleCreateQuest = (index: number) => {
    if (!activeId) return
    setCreatingIndex(index)
    setError(null)
    startTransition(async () => {
      const result = await createQuestFromSuggestion(activeId, index)
      if ('error' in result) {
        setError(result.error)
        setCreatingIndex(null)
        return
      }
      router.push(`/wallet?quest=${result.questId}`)
    })
  }

  // Transition ceremony (IE-19) before quest suggestions
  if (ceremony && pendingSuggestions && activeId && !suggestions) {
    return (
      <TransitionCeremony
        sceneType={ceremony.sceneType}
        kotterStage={ceremony.kotterStage}
        onComplete={() => {
          setSuggestions(pendingSuggestions)
          setCeremony(null)
          setPendingSuggestions(null)
        }}
      />
    )
  }

  // Suggestions view
  if (suggestions && activeId) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <p className="text-sm text-zinc-400">Here are a few ways this energy could move:</p>
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-2">
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
          onClick={() => {
            setSuggestions(null)
            setActiveId(null)
            setCeremony(null)
            setPendingSuggestions(null)
          }}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back
        </button>
      </div>
    )
  }

  // Already captured today — show message and link to reflect/explore
  if (hasChargedToday && todayCharge) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-6 text-center">
          <p className="text-emerald-200 font-medium">You&apos;ve already captured today&apos;s charge.</p>
          <p className="text-zinc-400 text-sm mt-2">Come back tomorrow for a new capture.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
          <p className="text-sm text-zinc-300 truncate">{todayCharge.title}</p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/shadow/321?chargeBarId=${todayCharge.id}`)}
              className="flex-1 py-2.5 rounded-lg bg-purple-900/40 border border-purple-800/50 text-purple-200 hover:bg-purple-800/50 text-sm font-medium transition"
            >
              Reflect
            </button>
            <button
              onClick={() => router.push(`/capture/explore/${todayCharge.id}`)}
              className="flex-1 py-2.5 rounded-lg bg-amber-900/40 border border-amber-800/50 text-amber-200 hover:bg-amber-800/50 text-sm font-medium transition"
            >
              Explore
            </button>
          </div>
        </div>
        <Link
          href="/"
          className="block w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-500 text-sm text-center hover:bg-zinc-900 transition"
        >
          ← Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Captured charges list */}
      {captured.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Captured this session</p>
          {captured.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800"
            >
              <p className="text-sm text-zinc-300 truncate">{c.title}</p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push(`/shadow/321?chargeBarId=${c.id}`)}
                  className="px-2.5 py-1 rounded-lg bg-purple-900/40 border border-purple-800/50 text-purple-300 text-xs font-medium hover:bg-purple-800/50 transition"
                >
                  Reflect
                </button>
                <button
                  onClick={() => handleExplore(c.id)}
                  disabled={isPending}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/40 border border-amber-800/50 text-amber-300 text-xs font-medium hover:bg-amber-800/50 transition disabled:opacity-50"
                >
                  Explore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Capture form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {captured.length > 0 && (
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Capture another</p>
        )}

        <div>
          <input
            type="text"
            value={form.summary}
            onChange={(e) => form.setSummary(e.target.value)}
            placeholder="e.g. Housing costs crushing me"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:border-purple-500 outline-none"
            autoFocus={captured.length === 0}
            maxLength={200}
          />
        </div>

        {/* Satisfaction */}
        <div>
          <p className="text-xs text-zinc-500 mb-2">Satisfaction</p>
          <div className="flex gap-2">
            {SATISFACTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => form.setSatisfaction(form.satisfaction === opt.value ? undefined : opt.value)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                  form.satisfaction === opt.value ? opt.active : opt.color + ' hover:bg-zinc-900/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emotion */}
        <div className="flex flex-wrap gap-2">
          {EMOTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => form.setEmotion(form.emotion === opt.value ? undefined : opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                form.emotion === opt.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Intensity */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Intensity:</span>
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => form.setIntensity(form.intensity === n ? undefined : n)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                form.intensity === n
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

      {captured.length > 0 && (
        <button
          onClick={() => router.push('/')}
          className="w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-500 text-sm hover:bg-zinc-900 transition"
        >
          Done → Dashboard
        </button>
      )}
    </div>
  )
}
