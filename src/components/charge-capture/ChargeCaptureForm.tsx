'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createChargeBar,
  generateQuestSuggestionsFromCharge,
  createQuestFromSuggestion,
} from '@/actions/charge-capture'
import type { CreateChargeBarPayload, ChargeExploreCeremony, PersonalMove } from '@/actions/charge-capture'
import { TransitionCeremony } from '@/components/charge-capture/TransitionCeremony'
import type { QuestSuggestion } from '@/lib/charge-quest-generator'

// ── Emotion options — large tap targets ──────────────────────────────────────

type EmotionOption = {
  value: NonNullable<CreateChargeBarPayload['emotion_channel']>
  label: string
  color: string
  active: string
}

const EMOTION_OPTIONS: EmotionOption[] = [
  { value: 'anger',     label: 'Anger',     color: 'border-zinc-700 text-zinc-400 hover:border-red-700/50',       active: 'border-red-600 bg-red-950/40 text-red-300' },
  { value: 'fear',      label: 'Fear',      color: 'border-zinc-700 text-zinc-400 hover:border-violet-700/50',    active: 'border-violet-600 bg-violet-950/40 text-violet-300' },
  { value: 'sadness',   label: 'Sadness',   color: 'border-zinc-700 text-zinc-400 hover:border-blue-700/50',      active: 'border-blue-600 bg-blue-950/40 text-blue-300' },
  { value: 'joy',       label: 'Joy',       color: 'border-zinc-700 text-zinc-400 hover:border-yellow-700/50',    active: 'border-yellow-500 bg-yellow-950/40 text-yellow-300' },
  { value: 'neutrality',label: 'Neutral',   color: 'border-zinc-700 text-zinc-400 hover:border-zinc-600',         active: 'border-zinc-500 bg-zinc-800 text-zinc-200' },
]

const SATISFACTION_OPTIONS: Array<{
  value: NonNullable<CreateChargeBarPayload['satisfaction']>
  label: string
  active: string
}> = [
  { value: 'dissatisfied', label: 'Low',  active: 'border-red-500 bg-red-950/30 text-red-300' },
  { value: 'neutral',      label: 'Mid',  active: 'border-yellow-500 bg-yellow-950/30 text-yellow-300' },
  { value: 'satisfied',    label: 'High', active: 'border-emerald-500 bg-emerald-950/30 text-emerald-300' },
]

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up', cleanUp: 'Clean Up', growUp: 'Grow Up', showUp: 'Show Up',
  wake_up: 'Wake Up', clean_up: 'Clean Up', grow_up: 'Grow Up', show_up: 'Show Up',
}

type MoveOption = {
  value: PersonalMove
  label: string
  hint: string
  color: string
  active: string
}

const MOVE_OPTIONS: MoveOption[] = [
  { value: 'wakeUp',  label: 'Wake Up',  hint: 'Name it fresh',        color: 'border-zinc-700 text-zinc-400 hover:border-emerald-700/50', active: 'border-emerald-600 bg-emerald-950/40 text-emerald-300' },
  { value: 'cleanUp', label: 'Clean Up', hint: 'Process the friction',  color: 'border-zinc-700 text-zinc-400 hover:border-sky-700/50',     active: 'border-sky-600 bg-sky-950/40 text-sky-300' },
  { value: 'growUp',  label: 'Grow Up',  hint: 'Develop through it',   color: 'border-zinc-700 text-zinc-400 hover:border-amber-700/50',   active: 'border-amber-500 bg-amber-950/40 text-amber-300' },
  { value: 'showUp',  label: 'Show Up',  hint: 'Act and contribute',   color: 'border-zinc-700 text-zinc-400 hover:border-purple-700/50',  active: 'border-purple-500 bg-purple-950/40 text-purple-300' },
]

type CapturedCharge = { id: string; title: string; personalMove?: PersonalMove }

type ChargeCaptureFormProps = {
  hasChargedToday?: boolean
  todayCharge?: { id: string; title: string; description: string; createdAt: string } | null
}

export function ChargeCaptureForm({ hasChargedToday = false, todayCharge }: ChargeCaptureFormProps = {}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const textRef = useRef<HTMLInputElement>(null)

  // Form state
  const [summary, setSummary] = useState('')
  const [emotion, setEmotion] = useState<CreateChargeBarPayload['emotion_channel']>()
  const [moveChoice, setMoveChoice] = useState<PersonalMove | undefined>()
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5 | undefined>()
  const [satisfaction, setSatisfaction] = useState<CreateChargeBarPayload['satisfaction']>()
  const [showMore, setShowMore] = useState(false)

  // Interaction state
  const [error, setError] = useState<string | null>(null)
  const [captured, setCaptured] = useState<CapturedCharge[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<QuestSuggestion[] | null>(null)
  const [ceremony, setCeremony] = useState<ChargeExploreCeremony | null>(null)
  const [pendingSuggestions, setPendingSuggestions] = useState<QuestSuggestion[] | null>(null)
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null)

  // Focus text input after emotion tap
  useEffect(() => {
    if (emotion) textRef.current?.focus()
  }, [emotion])

  const reset = () => {
    setSummary('')
    setEmotion(undefined)
    setMoveChoice(undefined)
    setIntensity(undefined)
    setSatisfaction(undefined)
    setShowMore(false)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim()) { setError('Say what feels charged'); return }
    setError(null)
    startTransition(async () => {
      const capturedSummary = summary.trim()
      const result = await createChargeBar({
        summary: capturedSummary,
        emotion_channel: emotion,
        intensity,
        satisfaction,
        personal_move: moveChoice,
      })
      if ('error' in result) { setError(result.error); return }
      if ('barId' in result) setCaptured((prev) => [...prev, { id: result.barId, title: capturedSummary, personalMove: moveChoice }])
      reset()
      router.refresh()
    })
  }

  const handleExplore = (barId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await generateQuestSuggestionsFromCharge(barId)
      if ('error' in result) { setError(result.error); return }
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
      if ('error' in result) { setError(result.error); setCreatingIndex(null); return }
      router.push(`/hand?quest=${result.questId}`)
    })
  }

  // ── Transition ceremony before quest suggestions ──────────────────────────
  if (ceremony && pendingSuggestions && activeId && !suggestions) {
    // Retrieve the move from the active charge's captured list or today's charge
    const activeMoveChoice = moveChoice ??
      captured.find((c) => c.id === activeId)?.personalMove ??
      (todayCharge?.id === activeId ? (todayCharge as { id: string; title: string; description: string; createdAt: string; moveType?: string }).moveType : undefined)
    return (
      <TransitionCeremony
        sceneType={ceremony.sceneType}
        kotterStage={ceremony.kotterStage}
        moveLabel={activeMoveChoice}
        onComplete={() => {
          setSuggestions(pendingSuggestions)
          setCeremony(null)
          setPendingSuggestions(null)
        }}
      />
    )
  }

  // ── Quest suggestions view ────────────────────────────────────────────────
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
          onClick={() => { setSuggestions(null); setActiveId(null); setCeremony(null); setPendingSuggestions(null) }}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back
        </button>
      </div>
    )
  }

  // ── Already captured today ────────────────────────────────────────────────
  if (hasChargedToday && todayCharge) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-5">
          <p className="text-emerald-200 font-medium text-sm">Today&apos;s charge is captured.</p>
          <p className="text-zinc-500 text-xs mt-1 leading-relaxed truncate">{todayCharge.title}</p>
        </div>
        <PostCaptureActions
          chargeId={todayCharge.id}
          onExplore={() => handleExplore(todayCharge.id)}
          isPending={isPending}
        />
        <Link
          href="/"
          className="block w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-500 text-sm text-center hover:bg-zinc-900 transition"
        >
          ← Dashboard
        </Link>
      </div>
    )
  }

  // ── Main capture form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Captured this session */}
      {captured.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Captured this session</p>
          {captured.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
              <p className="text-sm text-zinc-300 truncate">{c.title}</p>
              <PostCaptureActions
                chargeId={c.id}
                onExplore={() => handleExplore(c.id)}
                isPending={isPending}
                compact
              />
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {captured.length > 0 && (
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Capture another</p>
        )}

        {/* 1. Emotion — large tap targets, above text */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">What channel?</p>
          <div className="grid grid-cols-5 gap-1.5">
            {EMOTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEmotion(emotion === opt.value ? undefined : opt.value)}
                className={`py-3 rounded-xl border text-xs font-medium transition ${
                  emotion === opt.value ? opt.active : opt.color
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Move commitment — optional, compact */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">How are you metabolizing? <span className="text-zinc-700 normal-case tracking-normal">(optional)</span></p>
          <div className="grid grid-cols-2 gap-1.5">
            {MOVE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMoveChoice(moveChoice === opt.value ? undefined : opt.value)}
                className={`py-2.5 px-3 rounded-xl border text-left transition ${
                  moveChoice === opt.value ? opt.active : opt.color
                }`}
              >
                <span className="block text-xs font-semibold">{opt.label}</span>
                <span className="block text-[10px] opacity-60 mt-0.5">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Summary text input */}
        <div>
          <input
            ref={textRef}
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Name what's charged…"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-purple-500 outline-none text-sm"
            autoFocus={!emotion}
            maxLength={200}
          />
        </div>

        {/* 4. Submit */}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition"
        >
          {isPending ? 'Capturing…' : 'Capture'}
        </button>

        {/* 5. More detail — collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition"
          >
            {showMore ? '▲ Less detail' : '▼ Add intensity & satisfaction'}
          </button>
          {showMore && (
            <div className="mt-3 space-y-4 animate-in fade-in">
              {/* Satisfaction */}
              <div className="flex gap-2">
                <span className="text-xs text-zinc-600 self-center mr-1">Satisfaction:</span>
                {SATISFACTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSatisfaction(satisfaction === opt.value ? undefined : opt.value)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                      satisfaction === opt.value
                        ? opt.active
                        : 'border-zinc-700 text-zinc-500 hover:bg-zinc-900/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Intensity */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600">Intensity:</span>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIntensity(intensity === n ? undefined : n)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition ${
                      intensity === n
                        ? 'bg-amber-600 text-black'
                        : 'bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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

// ── Post-capture triage: Reflect / Explore / Act ──────────────────────────────

type PostCaptureActionsProps = {
  chargeId: string
  onExplore: () => void
  isPending: boolean
  compact?: boolean
}

function PostCaptureActions({ chargeId, onExplore, isPending, compact = false }: PostCaptureActionsProps) {
  const router = useRouter()

  if (compact) {
    return (
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={() => router.push(`/shadow/321?chargeBarId=${chargeId}`)}
          className="px-2.5 py-1.5 rounded-lg bg-purple-900/40 border border-purple-800/50 text-purple-300 text-xs font-medium hover:bg-purple-800/50 transition whitespace-nowrap"
        >
          Reflect
        </button>
        <button
          onClick={onExplore}
          disabled={isPending}
          className="px-2.5 py-1.5 rounded-lg bg-amber-900/40 border border-amber-800/50 text-amber-300 text-xs font-medium hover:bg-amber-800/50 transition disabled:opacity-50 whitespace-nowrap"
        >
          Explore
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={() => router.push(`/shadow/321?chargeBarId=${chargeId}`)}
        className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-purple-800/50 bg-purple-950/20 text-purple-300 hover:bg-purple-950/40 transition"
      >
        <span className="text-lg">◉</span>
        <span className="text-xs font-medium">Reflect</span>
        <span className="text-[10px] text-purple-500/80 text-center leading-tight px-1">321 process</span>
      </button>
      <button
        onClick={onExplore}
        disabled={isPending}
        className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-amber-800/50 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 transition disabled:opacity-50"
      >
        <span className="text-lg">◈</span>
        <span className="text-xs font-medium">Explore</span>
        <span className="text-[10px] text-amber-500/80 text-center leading-tight px-1">quest ideas</span>
      </button>
      <button
        onClick={() => router.push('/')}
        className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-emerald-800/50 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40 transition"
      >
        <span className="text-lg">◆</span>
        <span className="text-xs font-medium">Act</span>
        <span className="text-[10px] text-emerald-500/80 text-center leading-tight px-1">follow compass</span>
      </button>
    </div>
  )
}
