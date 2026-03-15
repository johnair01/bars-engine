'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDailyCheckIn } from '@/actions/alchemy'
import { linkCheckInToEncounter } from '@/actions/threshold-encounter'
import type { EmotionChannel, AlchemyAltitude } from '@/lib/alchemy/types'

// Inlined from wuxing.ts — avoids pulling server-only imports into client bundle
const SHENG_CYCLE: Record<string, string> = {
  anger: 'joy', joy: 'neutrality', neutrality: 'sadness', sadness: 'fear', fear: 'anger',
}
const KE_CYCLE: Record<string, string> = {
  anger: 'neutrality', neutrality: 'fear', fear: 'joy', joy: 'sadness', sadness: 'anger',
}

const CHANNEL_META: Record<string, { label: string; element: string; color: string; bg: string; border: string }> = {
  anger:     { label: 'Anger',     element: 'Wood (木)', color: 'text-red-300',    bg: 'bg-red-900/20',    border: 'border-red-700/40' },
  joy:       { label: 'Joy',       element: 'Fire (火)', color: 'text-yellow-300', bg: 'bg-yellow-900/20', border: 'border-yellow-700/40' },
  neutrality:{ label: 'Neutrality',element: 'Earth (土)',color: 'text-zinc-300',   bg: 'bg-zinc-900/20',   border: 'border-zinc-700/40' },
  sadness:   { label: 'Sadness',   element: 'Metal (金)',color: 'text-blue-300',   bg: 'bg-blue-900/20',   border: 'border-blue-700/40' },
  fear:      { label: 'Fear',      element: 'Water (水)',color: 'text-violet-300', bg: 'bg-violet-900/20', border: 'border-violet-700/40' },
}

const ALTITUDE_META: Record<string, { label: string; hint: Record<string, string> }> = {
  dissatisfied: {
    label: 'Dissatisfied',
    hint: { anger: 'frustration', joy: 'restlessness', neutrality: 'apathy', sadness: 'grief', fear: 'anxiety' },
  },
  neutral: {
    label: 'Neutral',
    hint: { anger: 'clarity', joy: 'appreciation', neutrality: 'presence', sadness: 'acceptance', fear: 'orientation' },
  },
  satisfied: {
    label: 'Satisfied',
    hint: { anger: 'bravery', joy: 'bliss', neutrality: 'peace', sadness: 'poignance', fear: 'excitement' },
  },
}

const CHANNELS = Object.keys(CHANNEL_META) as EmotionChannel[]
const ALTITUDES = ['dissatisfied', 'neutral', 'satisfied'] as AlchemyAltitude[]

type Step = 'entry' | 'stuckness' | 'channel' | 'altitude' | 'move_type' | 'launching' | 'done'

interface CompletedCheckIn {
  sceneId: string | null
  thresholdEncounterId: string | null
  channel: string
  altitude: string
  sceneTypeChosen: string | null
}

interface Props {
  playerId: string
  todayCheckIn: CompletedCheckIn | null
}

export function DailyCheckInQuest({ playerId, todayCheckIn }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('entry')
  const [stuckness, setStuckness] = useState(5)
  const [channel, setChannel] = useState<EmotionChannel | null>(null)
  const [altitude, setAltitude] = useState<AlchemyAltitude | null>(null)
  const [sceneType, setSceneType] = useState<'transcend' | 'generate' | 'control' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Already done today — show completion
  if (todayCheckIn) {
    const meta = channel ? CHANNEL_META[todayCheckIn.channel] : CHANNEL_META[todayCheckIn.channel]
    return (
      <div className={`rounded-xl border p-4 ${meta?.border ?? 'border-zinc-800'} ${meta?.bg ?? 'bg-zinc-900/20'} space-y-2`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Daily Alchemy Quest</p>
            <p className="text-sm text-zinc-300 font-medium">Check-in complete ✓</p>
          </div>
          <div className={`text-xs ${meta?.color ?? 'text-zinc-400'} opacity-70 capitalize`}>
            {todayCheckIn.channel} · {todayCheckIn.altitude}
          </div>
        </div>
        {(todayCheckIn.thresholdEncounterId || todayCheckIn.sceneId) ? (
          <button
            onClick={() => {
              if (todayCheckIn.thresholdEncounterId) {
                router.push(`/threshold-encounter/${todayCheckIn.thresholdEncounterId}`)
              } else {
                router.push(`/growth-scene/${todayCheckIn.sceneId}`)
              }
            }}
            className="w-full text-xs py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Resume scene →
          </button>
        ) : (
          <p className="text-xs text-zinc-600 italic">Scene completed. Come back tomorrow.</p>
        )}
      </div>
    )
  }

  const handleLaunch = () => {
    if (!channel || !altitude || !sceneType) return
    setError(null)
    setStep('launching')
    startTransition(async () => {
      try {
        // 1. Record check-in + set alchemy state
        await createDailyCheckIn(playerId, stuckness, channel, altitude, sceneType)

        // 2. Generate threshold encounter
        const hexagramId = Math.floor(Math.random() * 64) + 1
        const res = await fetch('/api/threshold-encounter/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sceneType, hexagramId, gmFace: 'shaman', beatMode: 'canonical' }),
        })
        let json: { encounter_id?: string; error?: string }
        try {
          json = await res.json() as typeof json
        } catch {
          setError(`Server error (${res.status}) — try again.`)
          setStep('move_type')
          return
        }
        if (json.error) { setError(json.error); setStep('move_type'); return }
        if (!json.encounter_id) { setError('No encounter returned — try again.'); setStep('move_type'); return }

        // 3. Link encounter to check-in
        await linkCheckInToEncounter(json.encounter_id)

        router.push(`/threshold-encounter/${json.encounter_id}`)
      } catch {
        setError('Network error — check your connection and try again.')
        setStep('move_type')
      }
    })
  }

  if (step === 'entry') {
    return (
      <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/10 p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-600 mb-0.5">Daily Quest</p>
          <h3 className="text-sm font-semibold text-emerald-300">Alchemy Check-in</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Name where you&apos;re stuck. Choose your move. Enter the scene.
          </p>
        </div>
        <button
          onClick={() => setStep('stuckness')}
          className="w-full py-2.5 rounded-lg bg-emerald-800/30 hover:bg-emerald-800/50 border border-emerald-700/40 text-emerald-300 text-sm font-medium transition"
        >
          Begin check-in →
        </button>
      </div>
    )
  }

  if (step === 'stuckness') {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 1 of 4</p>
          <h3 className="text-sm font-semibold text-zinc-200">Where are you right now?</h3>
          <p className="text-xs text-zinc-500 mt-0.5">0 = totally stuck · 10 = full flow</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Stuck</span>
            <span className="text-lg font-bold text-zinc-200">{stuckness}</span>
            <span>Flow</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={stuckness}
            onChange={(e) => setStuckness(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
        <button
          onClick={() => setStep('channel')}
          className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm transition"
        >
          Next →
        </button>
      </div>
    )
  }

  if (step === 'channel') {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 2 of 4</p>
          <h3 className="text-sm font-semibold text-zinc-200">Which emotion is active?</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {CHANNELS.map((ch) => {
            const m = CHANNEL_META[ch]
            return (
              <button
                key={ch}
                onClick={() => { setChannel(ch); setStep('altitude') }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition ${m.border} ${m.bg} hover:opacity-90`}
              >
                <span className={`text-sm font-medium ${m.color}`}>{m.label}</span>
                <span className="text-xs text-zinc-500">{m.element}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (step === 'altitude') {
    const meta = channel ? CHANNEL_META[channel] : null
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 3 of 4</p>
          <h3 className="text-sm font-semibold text-zinc-200">How far through it are you?</h3>
          {channel && <p className={`text-xs ${meta?.color ?? 'text-zinc-400'} mt-0.5 capitalize`}>{meta?.label} channel</p>}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {ALTITUDES.map((alt) => {
            const am = ALTITUDE_META[alt]
            const hint = channel ? am.hint[channel] : ''
            return (
              <button
                key={alt}
                onClick={() => { setAltitude(alt); setStep('move_type') }}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800 text-left transition"
              >
                <span className="text-sm text-zinc-200 font-medium capitalize">{am.label}</span>
                {hint && <span className="text-xs text-zinc-500 italic">{hint}</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (step === 'move_type') {
    const cMeta = channel ? CHANNEL_META[channel] : null
    const shengTarget = channel ? SHENG_CYCLE[channel] : null
    const keTarget = channel ? KE_CYCLE[channel] : null
    const shengLabel = shengTarget ? CHANNEL_META[shengTarget]?.label : null
    const keLabel = keTarget ? CHANNEL_META[keTarget]?.label : null

    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 4 of 4</p>
          <h3 className="text-sm font-semibold text-zinc-200">Choose your move type</h3>
          {channel && altitude && (
            <p className="text-xs text-zinc-500 mt-0.5 capitalize">
              {cMeta?.label} · {ALTITUDE_META[altitude]?.hint[channel] ?? altitude}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => { setSceneType('transcend'); }}
            className={`text-left px-3 py-3 rounded-lg border transition ${sceneType === 'transcend' ? 'border-emerald-500 bg-emerald-900/20' : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">Transcend ↑</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">rise within</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Stay in {cMeta?.label ?? 'this'} — deepen your relationship with this energy until it transforms.
            </p>
          </button>

          <button
            onClick={() => { setSceneType('generate'); }}
            className={`text-left px-3 py-3 rounded-lg border transition ${sceneType === 'generate' ? 'border-yellow-500 bg-yellow-900/20' : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">Generate →↑</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">生 shēng</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Nourish the next element{shengLabel ? `: flow into ${shengLabel}` : ''} — horizontal and rising.
            </p>
          </button>

          <button
            onClick={() => { setSceneType('control'); }}
            className={`text-left px-3 py-3 rounded-lg border transition ${sceneType === 'control' ? 'border-red-500 bg-red-900/20' : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">Control →↓</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">克 kè</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Master through the overcoming cycle{keLabel ? `: meet ${keLabel}` : ''} — horizontal, trending down.
            </p>
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleLaunch}
          disabled={!sceneType || isPending}
          className="w-full py-2.5 rounded-lg bg-emerald-800/40 hover:bg-emerald-700/40 border border-emerald-700/50 text-emerald-300 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? 'Opening scene…' : 'Enter scene →'}
        </button>
      </div>
    )
  }

  if (step === 'launching') {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4 flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-sm text-zinc-400">Opening your scene…</p>
      </div>
    )
  }

  return null
}
