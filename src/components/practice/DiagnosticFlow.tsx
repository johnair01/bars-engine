'use client'

// ---------------------------------------------------------------------------
// DiagnosticFlow — the Charge Diagnostic instrument (Practice Atlas §1.3).
// Pre-card / raw surface (UI_COVENANT §10): built on SceneCard, NOT
// CultivationCard. Element color is withheld the entire flow and appears for
// the first time only on The Read. Raw blocker/story text lives ONLY in local
// state and never leaves the client (§1.6); the classifier runs here and emits
// only an enum.
//
// Copy/controls per the Claude Design handoff
// (.specify/specs/emotional-alchemy-diagnostic/design_handoff). In-app font is
// the app sans (page sets font-sans) with tabular-nums on numerals; the
// marketing mono stack from the prototype is intentionally not used.
// ---------------------------------------------------------------------------

import { useMemo, useState, type CSSProperties } from 'react'
import { SceneCard, SceneInput, SceneShortInput, SceneNav } from '@/components/scene-card/SceneCard'
import {
  planSteps,
  finalizeResult,
  classifyBlockerShape,
  isCrisisIntensity,
  defaultAltitude,
  defaultTargetForChannel,
  defaultFeltShape,
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
  type FeltShape,
  type SatisfactionSpirit,
} from '@/lib/emotional-alchemy'
import { channelChipStyleA } from '@/lib/emotional-alchemy/channel-visuals'

type Props = {
  onComplete: (result: DiagnosticResult) => void
  onCrisis: () => void
  onCaptureOnly: () => void
}

type HarmChoice = 'onme' | 'witness' | 'both' | 'own'
const HARM_MAP: Record<HarmChoice, HarmRelation> = { onme: 'received', witness: 'witnessed', both: 'received', own: 'own_conduct' }

const eyebrow = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500'
const rowBase =
  'w-full min-h-[56px] rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-left transition-colors hover:border-zinc-600'
const rowSelected = 'border-purple-500 bg-purple-950/30 text-zinc-100'
const chipBase = 'min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:border-zinc-600'

const CHANNEL_OPTIONS: Array<{ value: ChannelPick; label: string; hint: string }> = [
  { value: 'anger', label: 'Mad', hint: 'heat · push · no' },
  { value: 'sadness', label: 'Sad', hint: 'weight · pull · loss' },
  { value: 'fear', label: 'Scared', hint: 'edge · brace · what-if' },
  { value: 'joy', label: 'Bright, stuck', hint: 'want · no traction' },
  { value: 'flat', label: 'Flat / numb', hint: 'muffled · far away' },
  { value: 'cant_tell', label: "I can't tell", hint: "won't name itself" },
]

const FLAT_OPTIONS: Array<{ value: FlatAnswer; label: string; hint: string }> = [
  { value: 'rested_calm', label: 'Rested', hint: 'settled, genuinely okay' },
  { value: 'walled_off', label: 'Walled-off', hint: 'something is behind the wall' },
  { value: 'buried', label: 'Buried', hint: 'too much, all at once' },
  { value: 'grey', label: 'Grey', hint: 'the aliveness went out of it' },
]

const HARM_OPTIONS: Array<{ value: HarmChoice; label: string; hint: string }> = [
  { value: 'onme', label: 'It landed on me', hint: 'I was the one it hit' },
  { value: 'witness', label: 'I witnessed it', hint: 'it happened to someone else' },
  { value: 'both', label: 'Both', hint: 'it hit me and others' },
  { value: 'own', label: "It's about my own conduct", hint: 'the repair is mine to make' },
]

const CHANNEL_LABEL: Record<EmotionChannel, string> = { anger: 'Anger', sadness: 'Sadness', fear: 'Fear', joy: 'Joy', neutrality: 'Neutrality' }
const TARGET_LABEL: Record<SatisfactionSpirit, string> = { peace: 'Peace', triumph: 'Triumph', poignance: 'Poignance', bliss: 'Bliss', wonder: 'Wonder' }
const ALTITUDE_LABEL: Record<Altitude, string> = { dissatisfied: 'Raw', neutral: 'Forming', satisfied: 'Formed' }
const FELT_LABEL: Record<FeltShape, string> = { knot: 'Knot', weight: 'Weight', fog: 'Fog', spark: 'Spark', static: 'Static', edge: 'Edge' }
const ALTITUDES: Altitude[] = ['dissatisfied', 'neutral', 'satisfied']
const SPIRITS: SatisfactionSpirit[] = ['peace', 'triumph', 'poignance', 'bliss', 'wonder']
const FELT_SHAPES: FeltShape[] = ['knot', 'weight', 'fog', 'spark', 'static', 'edge']
const CHANNELS: EmotionChannel[] = ['anger', 'sadness', 'fear', 'joy', 'neutrality']

function Row({ selected, onClick, label, hint }: { selected: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button type="button" onClick={onClick} className={`${rowBase} ${selected ? rowSelected : ''}`}>
      <span className="block text-sm font-semibold text-zinc-100">{label}</span>
      <span className={eyebrow + ' mt-0.5 block'}>{hint}</span>
    </button>
  )
}

function Pill({ selected, onClick, children, style }: { selected: boolean; onClick: () => void; children: React.ReactNode; style?: CSSProperties }) {
  return (
    <button type="button" onClick={onClick} style={selected ? style : undefined} className={`${chipBase} ${selected && !style ? rowSelected : ''}`}>
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------

export function DiagnosticFlow({ onComplete, onCrisis, onCaptureOnly }: Props) {
  const [answers, setAnswers] = useState<DiagnosticAnswers>({})
  const [current, setCurrent] = useState<DiagnosticStep>('blocker')
  const [history, setHistory] = useState<DiagnosticStep[]>([])
  const [harmChoice, setHarmChoice] = useState<HarmChoice | null>(null)

  const patch = (p: Partial<DiagnosticAnswers>) => setAnswers((a) => ({ ...a, ...p }))
  const plan = useMemo(() => planSteps(answers), [answers])

  const effChannel: EmotionChannel | null = (() => {
    if (answers.channelPick === 'flat' && answers.flatAnswer) return resolveFlat(answers.flatAnswer).channel ?? answers.channelConfirmed ?? null
    if (answers.channelPick === 'cant_tell') return answers.channelConfirmed ?? null
    if (answers.channelPick && answers.channelPick !== 'flat') return answers.channelPick
    return null
  })()

  function confirmChannel(c: EmotionChannel) {
    patch({ channelConfirmed: c, target: answers.target ?? defaultTargetForChannel(c), feltShape: answers.feltShape ?? defaultFeltShape(c) })
  }

  function enterDefaults() {
    // Routing shape stays classified silently (composer input); the player-facing
    // felt shape + target + altitude render as visible, editable defaults (§8.1).
    const { shape, confidence } = classifyBlockerShape(answers.blocker ?? '', answers.story)
    patch({
      shape: answers.shape ?? shape,
      shapeConfidence: answers.shapeConfidence ?? confidence,
      altitude: answers.altitude ?? (answers.intensity !== undefined ? defaultAltitude(answers.intensity) : 'dissatisfied'),
      target: answers.target ?? (effChannel ? defaultTargetForChannel(effChannel) : undefined),
      feltShape: answers.feltShape ?? (effChannel ? defaultFeltShape(effChannel) : undefined),
    })
  }

  function goNext() {
    const p = planSteps(answers)
    const next = p[p.indexOf(current) + 1]
    if (!next) return
    if (next === 'defaults') enterDefaults()
    if (next === 'summary') return onComplete(finalizeResult(answers))
    setHistory((h) => [...h, current])
    setCurrent(next)
  }

  function goBack() {
    setHistory((h) => {
      if (!h.length) return h
      setCurrent(h[h.length - 1])
      return h.slice(0, -1)
    })
  }

  const totalGuess = plan.length - 1
  const stepIndex = plan.indexOf(current)

  const canAdvance = (() => {
    switch (current) {
      case 'blocker': return !!answers.blocker?.trim()
      case 'thread': return !!answers.thread?.label.trim()
      case 'channel': return !!answers.channelPick
      case 'flat_fork': return !!answers.flatAnswer
      case 'cant_tell': return true
      case 'intensity': return typeof answers.intensity === 'number'
      case 'time': return !!answers.time
      case 'temporal': return !!answers.temporal
      case 'fuel': return !!answers.fuel
      case 'story': return true
      case 'layer_check': return !!answers.layerAnswer
      case 'harm_relation': return !!answers.harmRelation
      case 'safety': return typeof answers.safetyPowerOver === 'boolean'
      case 'defaults': {
        const needChannel = answers.channelPick === 'cant_tell' || (answers.channelPick === 'flat' && answers.flatAnswer === 'walled_off')
        return (!needChannel || !!answers.channelConfirmed) && !!answers.altitude && !!answers.target && !!answers.feltShape
      }
      default: return true
    }
  })()

  const nextLabel = current === 'defaults' ? 'See the read →' : current === 'story' && !answers.story?.trim() ? 'Skip — continue' : 'Continue →'

  return (
    <div className="space-y-8">
      {renderStep()}

      <SceneNav onBack={history.length ? goBack : undefined} onNext={goNext} nextDisabled={!canAdvance} nextLabel={nextLabel} />

      {/* Crisis exit present on every step (§8.4). */}
      <div className="flex flex-wrap items-center gap-4 border-t border-zinc-900 pt-4 text-xs">
        <button type="button" onClick={onCaptureOnly} className="text-zinc-600 transition-colors hover:text-zinc-400">
          Just get it down
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

  function progress(i: number) {
    return { current: i, total: totalGuess }
  }

  function renderStep() {
    switch (current) {
      case 'blocker':
        return (
          <SceneCard prompt="What's the charge?" subtext="Say it plainly, in your own words. Notice where in your body it lives." progress={progress(0)}>
            <SceneInput value={answers.blocker ?? ''} onChange={(v) => patch({ blocker: v })} placeholder="It's still sitting in my chest — that meeting…" autoFocus rows={3} />
          </SceneCard>
        )

      case 'thread':
        return (
          <SceneCard prompt="Name the thread." subtext="The storyline this belongs to — a word or two. You'll recognize it later." progress={progress(1)}>
            <SceneShortInput value={answers.thread?.label ?? ''} onChange={(v) => patch({ thread: { kind: 'new', label: v } })} placeholder="the standup thing" autoFocus />
          </SceneCard>
        )

      case 'channel':
        return (
          <SceneCard prompt="Which is closest?" subtext="You don't have to be sure. A first read is enough — it's still unformed." progress={progress(2)}>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_OPTIONS.map((o) => {
                const selected = answers.channelPick === o.value
                // Selected treatment: element hairline tint (A) for real channels;
                // Earth tint for flat; purple for the no-element "can't tell".
                const style: CSSProperties | undefined =
                  o.value === 'flat' ? channelChipStyleA('neutrality') : o.value === 'cant_tell' ? undefined : channelChipStyleA(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => patch({ channelPick: o.value })}
                    style={selected ? style : undefined}
                    className={`min-h-[72px] rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-left transition-colors hover:border-zinc-600 ${selected && !style ? rowSelected : ''}`}
                  >
                    <span className="block text-sm font-semibold text-zinc-100">{o.label}</span>
                    <span className={eyebrow + ' mt-1 block normal-case tracking-normal text-zinc-500'}>{o.hint}</span>
                  </button>
                )
              })}
            </div>
          </SceneCard>
        )

      case 'flat_fork':
        return (
          <SceneCard tone="somatized" prompt="Flat — but which flat?" subtext="Numbness has textures. Naming it is not the same as fixing it." progress={progress(stepIndex)}>
            <div className="grid gap-2">
              {FLAT_OPTIONS.map((o) => (
                <Row key={o.value} selected={answers.flatAnswer === o.value} onClick={() => patch({ flatAnswer: o.value })} label={o.label} hint={o.hint} />
              ))}
            </div>
          </SceneCard>
        )

      case 'cant_tell':
        return (
          <SceneCard tone="somatized" prompt="That's a real answer." subtext="We'll find where it sits in the body first — the felt thread — before naming a channel. Pick one if it surfaces, or leave it.">
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((c) => (
                <Pill key={c} selected={answers.channelConfirmed === c} onClick={() => confirmChannel(c)} style={channelChipStyleA(c)}>{CHANNEL_LABEL[c]}</Pill>
              ))}
            </div>
          </SceneCard>
        )

      case 'intensity': {
        const touched = typeof answers.intensity === 'number'
        const v = answers.intensity ?? 0
        const pct = (v / 10) * 100
        const crisisRange = touched && isCrisisIntensity(v) // 9–10 → seek outside help
        return (
          <SceneCard prompt="How loud, right now?" subtext="Not how bad — how loud. Drag to where it sits." progress={progress(stepIndex)}>
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-bold tabular-nums ${!touched ? 'text-zinc-700' : crisisRange ? 'text-amber-400' : 'text-zinc-100'}`}>{touched ? v : '—'}</span>
                <span className={eyebrow}>/ 10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={v}
                onChange={(e) => patch({ intensity: Number(e.target.value) })}
                aria-label="Charge intensity, 0 to 10"
                className="ea-intensity-range"
                style={touched ? { background: `linear-gradient(to right, #7c3aed ${pct}%, #2a2a27 ${pct}%)` } : undefined}
              />
              <div className="flex justify-between">
                <span className={eyebrow}>Quiet</span>
                <span className={eyebrow}>Flooding</span>
              </div>
              {crisisRange && (
                <div className="rounded-xl border border-amber-800/60 bg-zinc-900 px-4 py-3">
                  <p className={eyebrow + ' text-amber-500'}>A {v} is a lot to hold</p>
                  <p className="mt-1 text-sm text-zinc-300">At a 9 or 10, a practice may not be the right tool right now. Seeking outside help isn&apos;t failure — it&apos;s the strong move.</p>
                  <button type="button" onClick={() => { patch({ crisis: true }); onCrisis() }} className="mt-2 text-sm text-amber-400 hover:text-amber-300">
                    I need more than a practice →
                  </button>
                </div>
              )}
            </div>
          </SceneCard>
        )
      }

      case 'time':
        return (
          <SceneCard prompt="How much time do you have?" subtext="Be honest about right now, not your best self." progress={progress(stepIndex)}>
            <div className="grid gap-2">
              {([[2, 'a breath and a note'], [10, 'one real move'], [30, 'room to sit with it']] as [TimeBudget, string][]).map(([t, hint]) => (
                <Row key={t} selected={answers.time === t} onClick={() => patch({ time: t })} label={`${t} minutes`} hint={hint} />
              ))}
            </div>
          </SceneCard>
        )

      case 'temporal':
        return (
          <SceneCard prompt="When is this?" subtext="Where the charge lives in time changes the move." progress={progress(stepIndex)}>
            <div className="grid gap-2">
              {([['now', 'Happening now', 'live, in the room'], ['replay', 'Replaying', 'already happened, still looping'], ['upcoming', 'Coming up', 'bracing for it']] as [Temporal, string, string][]).map(([v, label, hint]) => (
                <Row key={v} selected={answers.temporal === v} onClick={() => patch({ temporal: v })} label={label} hint={hint} />
              ))}
            </div>
          </SceneCard>
        )

      case 'fuel':
        return (
          <SceneCard prompt="What's your fuel?" subtext="Capacity, not mood. It sizes the ask." progress={progress(stepIndex)}>
            <div className="grid gap-2">
              {([['depleted', 'Depleted', 'running on empty'], ['steady', 'Steady', 'enough to work with'], ['charged', 'Charged', 'plenty in the tank']] as [Fuel, string, string][]).map(([v, label, hint]) => (
                <Row key={v} selected={answers.fuel === v} onClick={() => patch({ fuel: v })} label={label} hint={hint} />
              ))}
            </div>
          </SceneCard>
        )

      case 'story':
        return (
          <SceneCard tone="charged" prompt="The story you're telling." subtext="Optional. The narration in your head — not the facts. Stuckness is data, not failure.">
            <SceneInput value={answers.story ?? ''} onChange={(v) => patch({ story: v })} placeholder="They think I can't handle it…" rows={3} />
          </SceneCard>
        )

      case 'layer_check':
        return (
          <SceneCard tone="revelatory" prompt="Want to check underneath?" subtext="Strong feelings sometimes guard another one. Fine to say no.">
            <div className="grid gap-2">
              {([['descended', 'Yes — look underneath', 'there may be another layer'], ['stayed', 'No — this is the one', 'the feeling is clear'], ['declined', 'Skip', 'not now']] as [LayerAnswer, string, string][]).map(([v, label, hint]) => (
                <Row key={v} selected={answers.layerAnswer === v} onClick={() => patch({ layerAnswer: v })} label={label} hint={hint} />
              ))}
            </div>
          </SceneCard>
        )

      case 'harm_relation':
        return (
          <SceneCard tone="charged" prompt="Did this land on you — or did you witness it?" subtext="Both are valid charges. The answer changes what a fair move even is.">
            <p className={eyebrow + ' -mt-3 mb-3 text-purple-400/80'}>A careful one</p>
            <div className="grid gap-2">
              {HARM_OPTIONS.map((o) => (
                <Row key={o.value} selected={harmChoice === o.value} onClick={() => { setHarmChoice(o.value); patch({ harmRelation: HARM_MAP[o.value] }) }} label={o.label} hint={o.hint} />
              ))}
            </div>
          </SceneCard>
        )

      case 'safety':
        return (
          <SceneCard tone="charged" prompt="Does acting on this involve someone with power over you?" subtext="A boss, your housing, your safety. If so, internal moves lead and anything external is your choice, with the stakes named.">
            <div className="grid grid-cols-2 gap-2">
              <Pill selected={answers.safetyPowerOver === true} onClick={() => patch({ safetyPowerOver: true })}>Yes</Pill>
              <Pill selected={answers.safetyPowerOver === false} onClick={() => patch({ safetyPowerOver: false })}>No</Pill>
            </div>
          </SceneCard>
        )

      case 'defaults': {
        const needChannel = answers.channelPick === 'cant_tell' || (answers.channelPick === 'flat' && answers.flatAnswer === 'walled_off')
        return (
          <SceneCard prompt="Here's what I'll assume." subtext="Asked, not inferred. Change any of it — nothing is locked.">
            <div className="space-y-5">
              {needChannel && (
                <div>
                  <p className={eyebrow + ' mb-2'}>Channel</p>
                  <div className="grid grid-cols-3 gap-2">
                    {CHANNELS.map((c) => (
                      <Pill key={c} selected={answers.channelConfirmed === c} onClick={() => confirmChannel(c)} style={channelChipStyleA(c)}>{CHANNEL_LABEL[c]}</Pill>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className={eyebrow + ' mb-2'}>Altitude — where it sits now</p>
                <div className="grid grid-cols-3 gap-2">
                  {ALTITUDES.map((al) => (
                    <Pill key={al} selected={answers.altitude === al} onClick={() => patch({ altitude: al })}>{ALTITUDE_LABEL[al]}</Pill>
                  ))}
                </div>
              </div>
              <div>
                <p className={eyebrow + ' mb-2'}>Target — what it wants to become</p>
                <div className="grid grid-cols-3 gap-2">
                  {SPIRITS.map((sp) => (
                    <Pill key={sp} selected={answers.target === sp} onClick={() => patch({ target: sp })}>{TARGET_LABEL[sp]}</Pill>
                  ))}
                </div>
                {effChannel && answers.target && answers.target !== defaultTargetForChannel(effChannel) && (
                  <p className="mt-2 text-xs text-zinc-500">Cross-channel — a translate move. Neutralizing because it&apos;s complete, or because that feeling is unwelcome here? Your call.</p>
                )}
              </div>
              <div>
                <p className={eyebrow + ' mb-2'}>Shape — how it&apos;s holding</p>
                <div className="grid grid-cols-3 gap-2">
                  {FELT_SHAPES.map((fs) => (
                    <Pill key={fs} selected={answers.feltShape === fs} onClick={() => patch({ feltShape: fs })}>{FELT_LABEL[fs]}</Pill>
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
