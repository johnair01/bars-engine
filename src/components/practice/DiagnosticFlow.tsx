'use client'

// ---------------------------------------------------------------------------
// DiagnosticFlow — the Charge Diagnostic instrument (Practice Atlas §1.3).
// Pre-card / raw surface (UI_COVENANT §10): built on SceneCard, NOT
// CultivationCard — the player has not yet formed an element-coded artifact.
// Raw blocker/story text lives ONLY in local state and never leaves the client
// (§1.6); the classifier runs here and emits only an enum.
// ---------------------------------------------------------------------------

import { useMemo, useState } from 'react'
import { SceneCard, SceneInput, SceneShortInput, SceneNav } from '@/components/scene-card/SceneCard'
import {
  planSteps,
  finalizeResult,
  classifyBlockerShape,
  defaultAltitude,
  defaultTargetForChannel,
  resolveFlat,
  type DiagnosticAnswers,
  type DiagnosticResult,
  type DiagnosticStep,
  type EmotionChannel,
  type ChannelPick,
  type FlatAnswer,
  type Temporal,
  type Fuel,
  type TimeBudget,
  type Altitude,
  type HarmRelation,
  type LayerAnswer,
} from '@/lib/emotional-alchemy'
import type { SatisfactionSpirit } from '@/lib/emotional-alchemy'

type Props = {
  onComplete: (result: DiagnosticResult) => void
  onCrisis: () => void
  onCaptureOnly: () => void
}

// ── chip vocabulary (raw pre-card; Tailwind utilities, not element hex) ──────

const CHANNEL_OPTIONS: Array<{ value: ChannelPick; label: string; hint: string; active: string }> = [
  { value: 'anger', label: 'Mad', hint: 'a boundary crossed', active: 'border-red-600 bg-red-950/40 text-red-300' },
  { value: 'sadness', label: 'Sad', hint: 'something lost', active: 'border-blue-600 bg-blue-950/40 text-blue-300' },
  { value: 'fear', label: 'Scared', hint: 'a risk or threat', active: 'border-violet-600 bg-violet-950/40 text-violet-300' },
  { value: 'joy', label: 'Bright-but-stuck', hint: 'aliveness with nowhere to go', active: 'border-yellow-500 bg-yellow-950/40 text-yellow-300' },
  { value: 'flat', label: 'Flat or numb', hint: 'low signal', active: 'border-zinc-500 bg-zinc-800 text-zinc-200' },
  { value: 'cant_tell', label: "I can't tell", hint: 'the felt sense hasn’t formed', active: 'border-teal-600 bg-teal-950/40 text-teal-300' },
]

const FLAT_OPTIONS: Array<{ value: FlatAnswer; label: string; hint: string }> = [
  { value: 'rested_calm', label: 'Rested — genuinely okay', hint: 'this is real calm' },
  { value: 'walled_off', label: "Walled-off — something's behind it", hint: 'a freeze, not rest' },
  { value: 'buried', label: 'Buried — too many things', hint: 'overload' },
  { value: 'grey', label: 'Grey — missing aliveness', hint: 'the play went out of it' },
]

const CHANNEL_LABEL: Record<EmotionChannel, string> = { anger: 'Anger', sadness: 'Sadness', fear: 'Fear', joy: 'Joy', neutrality: 'Neutrality' }
const TARGET_LABEL: Record<SatisfactionSpirit, string> = { peace: 'Peace', triumph: 'Triumph', poignance: 'Poignance', bliss: 'Bliss', wonder: 'Wonder' }
const ALTITUDES: Altitude[] = ['dissatisfied', 'neutral', 'satisfied']
const SPIRITS: SatisfactionSpirit[] = ['peace', 'triumph', 'poignance', 'bliss', 'wonder']
const CHANNELS: EmotionChannel[] = ['anger', 'sadness', 'fear', 'joy', 'neutrality']

const chipBase =
  'min-h-[44px] rounded-xl border px-4 py-2.5 text-sm text-left transition-colors border-zinc-700 text-zinc-400 hover:border-zinc-500'

function Chip({ selected, activeClass, onClick, children }: { selected: boolean; activeClass?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`${chipBase} ${selected ? activeClass ?? 'border-zinc-400 bg-zinc-800 text-zinc-100' : ''}`}>
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------

export function DiagnosticFlow({ onComplete, onCrisis, onCaptureOnly }: Props) {
  const [answers, setAnswers] = useState<DiagnosticAnswers>({})
  const [current, setCurrent] = useState<DiagnosticStep>('blocker')
  const [history, setHistory] = useState<DiagnosticStep[]>([])

  const patch = (p: Partial<DiagnosticAnswers>) => setAnswers((a) => ({ ...a, ...p }))

  const plan = useMemo(() => planSteps(answers), [answers])

  // Effective channel for default computation (may be null until confirmed).
  const effChannel: EmotionChannel | null = (() => {
    if (answers.channelPick === 'flat' && answers.flatAnswer) return resolveFlat(answers.flatAnswer).channel ?? answers.channelConfirmed ?? null
    if (answers.channelPick === 'cant_tell') return answers.channelConfirmed ?? null
    if (answers.channelPick && answers.channelPick !== 'flat') return answers.channelPick
    return null
  })()

  function enterDefaults() {
    // Apply visible, editable defaults on arrival (§8.1) — pre-filled, one tap to change.
    const { shape, confidence } = classifyBlockerShape(answers.blocker ?? '', answers.story)
    patch({
      altitude: answers.altitude ?? (answers.intensity !== undefined ? defaultAltitude(answers.intensity) : 'dissatisfied'),
      target: answers.target ?? (effChannel ? defaultTargetForChannel(effChannel) : undefined),
      shape: answers.shape ?? shape,
      shapeConfidence: answers.shapeConfidence ?? confidence,
    })
  }

  function goNext() {
    const p = planSteps(answers)
    const idx = p.indexOf(current)
    const next = p[idx + 1]
    if (!next) return
    if (next === 'defaults') enterDefaults()
    if (next === 'summary') {
      onComplete(finalizeResult(answers))
      return
    }
    setHistory((h) => [...h, current])
    setCurrent(next)
  }

  function goBack() {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setCurrent(prev)
      return h.slice(0, -1)
    })
  }

  const totalGuess = plan.length - 1 // exclude summary marker

  function confirmChannel(c: EmotionChannel) {
    patch({ channelConfirmed: c, target: answers.target ?? defaultTargetForChannel(c) })
  }

  // Gate: can we advance from the current step?
  const canAdvance = (() => {
    switch (current) {
      case 'blocker': return !!answers.blocker?.trim()
      case 'thread': return !!answers.thread
      case 'channel': return !!answers.channelPick
      case 'flat_fork': return !!answers.flatAnswer
      case 'cant_tell': return true // acknowledgment; channel confirmed at defaults
      case 'intensity': return typeof answers.intensity === 'number'
      case 'time': return !!answers.time
      case 'temporal': return !!answers.temporal
      case 'fuel': return !!answers.fuel
      case 'story': return true // story is optional (situation ≠ interpretation, but may be blank)
      case 'layer_check': return !!answers.layerAnswer
      case 'harm_relation': return !!answers.harmRelation
      case 'safety': return typeof answers.safetyPowerOver === 'boolean'
      case 'defaults': {
        const needChannel = (answers.channelPick === 'cant_tell') || (answers.channelPick === 'flat' && answers.flatAnswer === 'walled_off')
        return (!needChannel || !!answers.channelConfirmed) && !!answers.altitude && !!answers.target
      }
      default: return true
    }
  })()

  return (
    <div className="space-y-8">
      {renderStep()}

      <SceneNav onBack={history.length ? goBack : undefined} onNext={goNext} nextDisabled={!canAdvance} nextLabel={current === 'defaults' ? 'See my read →' : 'Continue →'} />

      {/* Secondary + crisis affordances — the crisis exit is present on every step (§8.4). */}
      <div className="flex flex-wrap items-center gap-4 border-t border-zinc-900 pt-4 text-xs">
        <button type="button" onClick={onCaptureOnly} className="text-zinc-600 transition-colors hover:text-zinc-400">
          Just get it down (capture only)
        </button>
        <button
          type="button"
          onClick={() => { patch({ crisis: true }); onCrisis() }}
          className="ml-auto rounded-lg border border-zinc-800 px-3 py-2 text-zinc-500 transition-colors hover:border-amber-800/60 hover:text-amber-300"
        >
          I need more than a practice
        </button>
      </div>
    </div>
  )

  function renderStep() {
    switch (current) {
      case 'blocker':
        return (
          <SceneCard prompt="What's charged right now?" subtext="Before you type — pause a moment and notice where in your body it lives. One sentence is enough. It stays on your device." progress={{ current: 0, total: totalGuess }}>
            <SceneInput value={answers.blocker ?? ''} onChange={(v) => patch({ blocker: v })} placeholder="Name the blocker in one sentence…" autoFocus rows={3} />
          </SceneCard>
        )

      case 'thread':
        return (
          <SceneCard prompt="New, or one you're already working?" subtext="A short name lets the game notice patterns across sessions. Your words aren't the name — you choose the label." progress={{ current: 1, total: totalGuess }}>
            <div className="space-y-2">
              <SceneShortInput value={answers.thread?.label ?? ''} onChange={(v) => patch({ thread: { kind: 'new', label: v } })} placeholder="Label this thread (e.g. logistics-resentment)…" autoFocus />
            </div>
          </SceneCard>
        )

      case 'channel':
        return (
          <SceneCard prompt="Which is closest?" subtext="One tap. This is asked, never guessed." progress={{ current: 2, total: totalGuess }}>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_OPTIONS.map((o) => (
                <Chip key={o.value} selected={answers.channelPick === o.value} activeClass={o.active} onClick={() => patch({ channelPick: o.value })}>
                  <span className="block font-medium">{o.label}</span>
                  <span className="block text-xs text-zinc-500">{o.hint}</span>
                </Chip>
              ))}
            </div>
          </SceneCard>
        )

      case 'flat_fork':
        return (
          <SceneCard tone="somatized" prompt="Flat can be two very different things." subtext="Which is it? Flatness never routes to Peace on its own — this is the check." progress={{ current: 3, total: totalGuess }}>
            <div className="grid gap-2">
              {FLAT_OPTIONS.map((o) => (
                <Chip key={o.value} selected={answers.flatAnswer === o.value} onClick={() => patch({ flatAnswer: o.value })}>
                  <span className="block font-medium">{o.label}</span>
                  <span className="block text-xs text-zinc-500">{o.hint}</span>
                </Chip>
              ))}
            </div>
          </SceneCard>
        )

      case 'cant_tell':
        return (
          <SceneCard tone="somatized" prompt="That's a real answer." subtext="We'll start by finding where it sits in the body — the felt thread — before naming a channel. You can pick one now if one surfaces, or leave it.">
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((c) => (
                <Chip key={c} selected={answers.channelConfirmed === c} onClick={() => patch({ channelConfirmed: c })}>
                  {CHANNEL_LABEL[c]}
                </Chip>
              ))}
            </div>
          </SceneCard>
        )

      case 'intensity':
        return (
          <SceneCard prompt="How strong is the charge?" subtext="0 = barely there, 10 = it's all I can feel." progress={{ current: 4, total: totalGuess }}>
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                {Array.from({ length: 11 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => patch({ intensity: i })} className={`min-h-[44px] rounded-lg border text-sm tabular-nums transition-colors ${answers.intensity === i ? 'border-purple-500 bg-purple-950/40 text-purple-200' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                    {i}
                  </button>
                ))}
              </div>
              {answers.intensity === 10 && (
                <p className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
                  A 10 is a lot to hold. Do you need support beyond a practice right now? The exit below is always here.
                </p>
              )}
            </div>
          </SceneCard>
        )

      case 'time':
        return (
          <SceneCard prompt="How much time do you have?" progress={{ current: 5, total: totalGuess }}>
            <div className="grid grid-cols-3 gap-2">
              {([2, 10, 30] as TimeBudget[]).map((t) => (
                <Chip key={t} selected={answers.time === t} onClick={() => patch({ time: t })}>
                  <span className="tabular-nums">{t}</span> min
                </Chip>
              ))}
            </div>
          </SceneCard>
        )

      case 'temporal':
        return (
          <SceneCard prompt="When is this?" progress={{ current: 6, total: totalGuess }}>
            <div className="grid gap-2">
              {([['now', 'Happening now'], ['replay', 'Replaying the past'], ['upcoming', 'Coming up']] as [Temporal, string][]).map(([v, label]) => (
                <Chip key={v} selected={answers.temporal === v} onClick={() => patch({ temporal: v })}>{label}</Chip>
              ))}
            </div>
          </SceneCard>
        )

      case 'fuel':
        return (
          <SceneCard prompt="What's your fuel like?" subtext="Running on empty is worth knowing — rest can be the move." progress={{ current: 7, total: totalGuess }}>
            <div className="grid grid-cols-3 gap-2">
              {([['depleted', 'Depleted'], ['steady', 'Steady'], ['charged', 'Charged']] as [Fuel, string][]).map(([v, label]) => (
                <Chip key={v} selected={answers.fuel === v} onClick={() => patch({ fuel: v })}>{label}</Chip>
              ))}
            </div>
          </SceneCard>
        )

      case 'story':
        return (
          <SceneCard tone="charged" prompt="What are you telling yourself about it?" subtext="The story, not the situation — they're different, and that difference is the whole game. Optional. Stays on your device.">
            <SceneInput value={answers.story ?? ''} onChange={(v) => patch({ story: v })} placeholder="The story I'm telling is…" rows={3} />
          </SceneCard>
        )

      case 'layer_check':
        return (
          <SceneCard tone="revelatory" prompt="Want to check underneath?" subtext="Strong feelings sometimes guard another one. Totally fine to say no.">
            <div className="grid gap-2">
              {([['descended', 'Yes — look underneath'], ['stayed', 'No — this is the one'], ['declined', 'Skip']] as [LayerAnswer, string][]).map(([v, label]) => (
                <Chip key={v} selected={answers.layerAnswer === v} onClick={() => patch({ layerAnswer: v })}>{label}</Chip>
              ))}
            </div>
          </SceneCard>
        )

      case 'harm_relation':
        return (
          <SceneCard tone="charged" prompt="Did you witness this, or receive it?" subtext="This changes everything downstream — it's asked, never assumed.">
            <div className="grid gap-2">
              {([['received', 'I received it'], ['witnessed', 'I witnessed it happen to someone else'], ['own_conduct', "It's about my own conduct"]] as [HarmRelation, string][]).map(([v, label]) => (
                <Chip key={v} selected={answers.harmRelation === v} onClick={() => patch({ harmRelation: v })}>{label}</Chip>
              ))}
            </div>
          </SceneCard>
        )

      case 'safety':
        return (
          <SceneCard tone="charged" prompt="Does acting on this involve someone with power over you?" subtext="A boss, your housing, your safety. If so, internal moves lead and anything external is your choice, with the stakes named.">
            <div className="grid grid-cols-2 gap-2">
              <Chip selected={answers.safetyPowerOver === true} onClick={() => patch({ safetyPowerOver: true })}>Yes</Chip>
              <Chip selected={answers.safetyPowerOver === false} onClick={() => patch({ safetyPowerOver: false })}>No</Chip>
            </div>
          </SceneCard>
        )

      case 'defaults': {
        const needChannel = (answers.channelPick === 'cant_tell') || (answers.channelPick === 'flat' && answers.flatAnswer === 'walled_off')
        return (
          <SceneCard prompt="Here's the read — adjust anything." subtext="These are starting points, not verdicts. One tap to change.">
            <div className="space-y-5">
              {needChannel && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-zinc-600">Channel</p>
                  <div className="grid grid-cols-3 gap-2">
                    {CHANNELS.map((c) => (
                      <Chip key={c} selected={answers.channelConfirmed === c} onClick={() => confirmChannel(c)}>{CHANNEL_LABEL[c]}</Chip>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-zinc-600">Where you want to land</p>
                <div className="grid grid-cols-3 gap-2">
                  {SPIRITS.map((sp) => (
                    <Chip key={sp} selected={answers.target === sp} onClick={() => patch({ target: sp })}>{TARGET_LABEL[sp]}</Chip>
                  ))}
                </div>
                {effChannel && answers.target && answers.target !== defaultTargetForChannel(effChannel) && (
                  <p className="mt-2 text-xs text-zinc-500">Cross-channel — a translate move. Neutralizing because it's complete, or because that feeling is unwelcome here? Your call.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-zinc-600">Altitude</p>
                <div className="grid grid-cols-3 gap-2">
                  {ALTITUDES.map((al) => (
                    <Chip key={al} selected={answers.altitude === al} onClick={() => patch({ altitude: al })}>{al[0].toUpperCase() + al.slice(1)}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </SceneCard>
        )
      }

      default:
        return null
    }
  }
}
