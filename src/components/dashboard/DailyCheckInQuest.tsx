'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDailyCheckIn } from '@/actions/alchemy'
import { linkCheckInToEncounter } from '@/actions/threshold-encounter'
import type { EmotionChannel, AlchemyAltitude } from '@/lib/alchemy/types'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { useNation } from '@/lib/ui/nation-provider'

// Inlined from wuxing.ts — avoids pulling server-only imports into client bundle
const SHENG_CYCLE: Record<string, string> = {
  anger: 'joy', joy: 'neutrality', neutrality: 'sadness', sadness: 'fear', fear: 'anger',
}
const KE_CYCLE: Record<string, string> = {
  anger: 'neutrality', neutrality: 'fear', fear: 'joy', joy: 'sadness', sadness: 'anger',
}

// Canonical channel → element mapping (matches wuxing.ts ontology)
// anger=fire, joy=wood, neutrality=earth, fear=metal, sadness=water
const CHANNEL_TO_ELEMENT: Record<string, ElementKey> = {
  anger:      'fire',
  joy:        'wood',
  neutrality: 'earth',
  fear:       'metal',
  sadness:    'water',
}

// ─── CHANNEL_META removed — use ELEMENT_TOKENS instead ────────────────────────
// Channel labels derive directly from ELEMENT_TOKENS (single source of truth):
//   display name  → capitalize(channelKey)    e.g. 'anger' → 'Anger'
//   element label → elementDisplayLabel(el)   e.g. 'fire'  → 'Fire (火)'
//
// ELEMENT_TOKENS[el].sigil carries the hanzi character for each element;
// no duplicate string literals are needed here.

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)
}

/** Derives a human-readable element label from ELEMENT_TOKENS.
 *  e.g. 'fire' → 'Fire (火)',  'wood' → 'Wood (木)'
 */
function elementDisplayLabel(el: ElementKey): string {
  return `${capitalize(el)} (${ELEMENT_TOKENS[el].sigil})`
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

const CHANNELS = Object.keys(CHANNEL_TO_ELEMENT) as EmotionChannel[]
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
  const { element: playerElement } = useNation()
  const [step, setStep] = useState<Step>('entry')
  const [stuckness, setStuckness] = useState(5)
  const [channel, setChannel] = useState<EmotionChannel | null>(null)
  const [altitude, setAltitude] = useState<AlchemyAltitude | null>(null)
  const [sceneType, setSceneType] = useState<'transcend' | 'generate' | 'control' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Already done today — show completion
  if (todayCheckIn) {
    const doneElement: ElementKey = CHANNEL_TO_ELEMENT[todayCheckIn.channel] ?? 'earth'
    const doneTokens = ELEMENT_TOKENS[doneElement]
    return (
      <CultivationCard element={doneElement} altitude="satisfied" stage="seed" className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Daily Alchemy Quest</p>
              <p className={`text-sm font-medium ${doneTokens.textAccent}`}>Check-in complete ✓</p>
            </div>
            <div className={`text-xs ${doneTokens.textAccent} opacity-70 capitalize`}>
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
      </CultivationCard>
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
    // Use player's nation element for the entry step
    const entryElement: ElementKey = playerElement ?? 'earth'
    const entryTokens = ELEMENT_TOKENS[entryElement]
    return (
      <CultivationCard element={entryElement} altitude="neutral" stage="seed" className="p-4">
        <div className="space-y-3">
          <div>
            <p className={`text-[10px] uppercase tracking-widest mb-0.5 ${entryTokens.textAccent} opacity-70`}>Daily Quest</p>
            <h3 className={`text-sm font-semibold ${entryTokens.textAccent}`}>Alchemy Check-in</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Name where you&apos;re stuck. Choose your move. Enter the scene.
            </p>
          </div>
          <button
            onClick={() => setStep('stuckness')}
            className={`w-full py-2.5 rounded-lg ${entryTokens.badgeBg} hover:opacity-90 border ${entryTokens.border} ${entryTokens.textAccent} text-sm font-medium transition`}
          >
            Begin check-in →
          </button>
        </div>
      </CultivationCard>
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
            const el: ElementKey = CHANNEL_TO_ELEMENT[ch] ?? 'earth'
            const t = ELEMENT_TOKENS[el]
            return (
              <button
                key={ch}
                onClick={() => { setChannel(ch); setStep('altitude') }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition ${t.border} ${t.bg} hover:opacity-90`}
              >
                <span className={`text-sm font-medium ${t.textAccent}`}>{capitalize(ch)}</span>
                <span className="text-xs text-zinc-500">{elementDisplayLabel(el)}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (step === 'altitude') {
    const activeEl: ElementKey = channel ? (CHANNEL_TO_ELEMENT[channel] ?? 'earth') : 'earth'
    const activeTokens = ELEMENT_TOKENS[activeEl]
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 3 of 4</p>
          <h3 className="text-sm font-semibold text-zinc-200">How far through it are you?</h3>
          {channel && <p className={`text-xs ${activeTokens.textAccent} mt-0.5 capitalize`}>{capitalize(channel)} channel</p>}
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
    const activeEl: ElementKey = channel ? (CHANNEL_TO_ELEMENT[channel] ?? 'earth') : 'earth'
    const activeTokens = ELEMENT_TOKENS[activeEl]
    const shengTarget = channel ? SHENG_CYCLE[channel] : null
    const keTarget = channel ? KE_CYCLE[channel] : null
    const shengLabel = shengTarget ? capitalize(shengTarget) : null
    const keLabel = keTarget ? capitalize(keTarget) : null

    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 4 of 4</p>
          <h3 className="text-sm font-semibold text-zinc-200">Choose your move type</h3>
          {channel && altitude && (
            <p className="text-xs text-zinc-500 mt-0.5 capitalize">
              {capitalize(channel)} · {ALTITUDE_META[altitude]?.hint[channel] ?? altitude}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => { setSceneType('transcend'); }}
            className={`text-left px-3 py-3 rounded-lg border transition ${sceneType === 'transcend' ? `${ELEMENT_TOKENS.wood.border} ${ELEMENT_TOKENS.wood.bg}` : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">Transcend ↑</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">rise within</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Stay in {channel ? capitalize(channel) : 'this'} — deepen your relationship with this energy until it transforms.
            </p>
          </button>

          <button
            onClick={() => { setSceneType('generate'); }}
            className={`text-left px-3 py-3 rounded-lg border transition ${sceneType === 'generate' ? `${ELEMENT_TOKENS.fire.border} ${ELEMENT_TOKENS.fire.bg}` : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800'}`}
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
            className={`text-left px-3 py-3 rounded-lg border transition ${sceneType === 'control' ? `${ELEMENT_TOKENS.water.border} ${ELEMENT_TOKENS.water.bg}` : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800'}`}
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
          className={`w-full py-2.5 rounded-lg ${activeTokens.badgeBg} hover:opacity-90 border ${activeTokens.border} ${activeTokens.textAccent} text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed`}
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
