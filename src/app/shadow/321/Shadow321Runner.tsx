'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SceneCard, SceneInput, SceneShortInput, SceneNav } from '@/components/scene-card/SceneCard'
import { createQuestFrom321Metadata, fuelSystemFrom321, persist321Session } from '@/actions/charge-metabolism'
import { discoverDaemon } from '@/actions/daemons'
import { deriveMetadata321 } from '@/lib/quest-grammar'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type AlignedAction = 'Wake Up' | 'Clean Up' | 'Grow Up' | 'Show Up'

type Answers = {
  // Phase 3: Face It (3rd person)
  chargeDescription: string  // "There is something I'm carrying…"
  maskShape: string          // "If it were a presence, it would be…"
  maskName: string           // "I'll call this…"
  // Phase 2: Talk to It (2nd person)
  desire: string             // what it wants
  desireOutcome: string      // what it gets from that
  lifeState: string          // what life is like for it
  rootCause: string          // what would have to be true
  fear: string               // what it fears
  // Phase 1: Be It (1st person)
  interiorVoice: string      // speaking as the mask from within
  integrationShift: string   // what shifts when held with awareness
}

type Phase =
  | 'face_1'      // describe the charge
  | 'face_2'      // give it a shape
  | 'face_3'      // give it a name
  | 'talk_1'      // what does it want
  | 'talk_2'      // what does it get from that
  | 'talk_3'      // what is life like for it
  | 'talk_4'      // what would have to be true
  | 'talk_5'      // what does it fear
  | 'be_1'        // let it speak from within
  | 'be_2'        // what shifts
  | 'alchemy'     // emotional alchemy reveal — dissatisfied → satisfied
  | 'artifact'    // dispatch: quest, BAR, daemon, fuel, save
  | 'done'

const PHASE_ORDER: Phase[] = [
  'face_1', 'face_2', 'face_3',
  'talk_1', 'talk_2', 'talk_3', 'talk_4', 'talk_5',
  'be_1', 'be_2',
  'alchemy',
  'artifact',
]

const DISCOVERY_PHASES: Phase[] = [
  'face_1', 'face_2', 'face_3',
  'talk_1', 'talk_2', 'talk_3', 'talk_4', 'talk_5',
  'be_1', 'be_2',
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  playerId: string
  /** Pre-fill the opening charge description (e.g. from a charge BAR) */
  initialCharge?: string
  /** Return path after completion */
  returnTo?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Shadow321Runner({ playerId, initialCharge, returnTo }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('face_1')
  const [alignedAction, setAlignedAction] = useState<AlignedAction | ''>('')
  const [answers, setAnswers] = useState<Answers>({
    chargeDescription: initialCharge ?? '',
    maskShape: '',
    maskName: '',
    desire: '',
    desireOutcome: '',
    lifeState: '',
    rootCause: '',
    fear: '',
    interiorVoice: '',
    integrationShift: '',
  })

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function set(key: keyof Answers, val: string) {
    setAnswers((prev) => ({ ...prev, [key]: val }))
  }

  function goNext() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx < PHASE_ORDER.length - 1) setPhase(PHASE_ORDER[idx + 1])
  }

  function goBack() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx > 0) setPhase(PHASE_ORDER[idx - 1])
  }

  const discoveryProgress = DISCOVERY_PHASES.includes(phase)
    ? { current: DISCOVERY_PHASES.indexOf(phase), total: DISCOVERY_PHASES.length }
    : undefined

  function buildMetadata() {
    return deriveMetadata321(
      { identityFreeText: [answers.maskShape, answers.maskName].filter(Boolean).join(' — ') },
      {
        q1: answers.chargeDescription,
        q2: [],
        q3: answers.lifeState,
        q4: [],
        q5: answers.rootCause,
        q6: [],
        alignedAction: alignedAction || undefined,
      },
      {
        identification: answers.maskName,
        integration: answers.integrationShift,
      }
    )
  }

  // -------------------------------------------------------------------------
  // Artifact dispatch handlers
  // -------------------------------------------------------------------------

  function handleTurnIntoQuest() {
    setError(null)
    startTransition(async () => {
      const metadata = buildMetadata()
      const phase2 = {
        q1: answers.chargeDescription,
        q2: [] as string[],
        q3: answers.lifeState,
        q4: [] as string[],
        q5: answers.rootCause,
        q6: [] as string[],
        alignedAction: alignedAction || undefined,
      }
      const phase3 = { identityFreeText: [answers.maskShape, answers.maskName].filter(Boolean).join(' — ') }
      const res = await createQuestFrom321Metadata(metadata, phase2, phase3)
      if (res && 'error' in res) {
        setError(res.error)
      } else if (res?.success) {
        router.push(returnTo ?? '/')
        router.refresh()
      }
    })
  }

  function handleFuelSystem() {
    setError(null)
    startTransition(async () => {
      const metadata = buildMetadata()
      const res = await fuelSystemFrom321(metadata)
      if (res && 'error' in res) {
        setError(res.error)
      } else {
        router.push(returnTo ?? '/')
        router.refresh()
      }
    })
  }

  function handleCreateBAR() {
    if (typeof window !== 'undefined') {
      const metadata = buildMetadata()
      const phase2 = {
        q1: answers.chargeDescription,
        q2: [],
        q3: answers.lifeState,
        q4: [],
        q5: answers.rootCause,
        q6: [],
        alignedAction: alignedAction || undefined,
      }
      sessionStorage.setItem('shadow321_metadata', JSON.stringify(metadata))
      sessionStorage.setItem('shadow321_session', JSON.stringify({
        phase3Snapshot: JSON.stringify({ identityFreeText: [answers.maskShape, answers.maskName].filter(Boolean).join(' — ') }),
        phase2Snapshot: JSON.stringify(phase2),
      }))
    }
    router.push('/create-bar?from321=1')
  }

  function handleDiscoverDaemon() {
    setError(null)
    startTransition(async () => {
      const res = await discoverDaemon(playerId, '321_wake_up', {
        name: answers.maskName || `From: ${answers.chargeDescription.slice(0, 30)}`,
      })
      if (res.error) {
        setError(res.error)
      } else {
        router.push('/daemons')
        router.refresh()
      }
    })
  }

  function handleSaveAndClose() {
    setError(null)
    startTransition(async () => {
      await persist321Session({
        phase3Snapshot: JSON.stringify({ identityFreeText: [answers.maskShape, answers.maskName].filter(Boolean).join(' — ') }),
        phase2Snapshot: JSON.stringify({ q1: answers.chargeDescription, q3: answers.lifeState, q5: answers.rootCause, alignedAction }),
        outcome: 'skipped',
      })
      router.push(returnTo ?? '/')
      router.refresh()
    })
  }

  // -------------------------------------------------------------------------
  // Render — scene cards
  // -------------------------------------------------------------------------

  if (phase === 'face_1') {
    // TODO: subtext should append a privacy policy link once /privacy exists (Sage-authored, teal frame)
    return (
      <SceneCard
        gmVoice="shaman"
        gmLine="Something has your attention. Let's find out what it is."
        prompt="There is something I'm carrying. When I sit with it, I notice…"
        subtext="Write freely. This stays private."
        tone="contemplative"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.chargeDescription}
          onChange={(v) => set('chargeDescription', v)}
          placeholder="Describe what you're carrying…"
          rows={5}
          autoFocus
        />
        <SceneNav
          onNext={goNext}
          nextDisabled={!answers.chargeDescription.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'face_2') {
    return (
      <SceneCard
        gmVoice="shaman"
        gmLine="Let it take form outside of you."
        prompt="If this were a presence — a figure, a creature, an energy — it would be…"
        subtext="A name, an image, a posture. Something with character."
        tone="contemplative"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.maskShape}
          onChange={(v) => set('maskShape', v)}
          placeholder="Describe its shape, quality, or presence…"
          rows={4}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.maskShape.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'face_3') {
    return (
      <SceneCard
        gmVoice="shaman"
        gmLine="Give it a name."
        prompt="I'll call this part of me…"
        subtext="A name helps you address it directly in the next phase."
        tone="contemplative"
        progress={discoveryProgress}
      >
        <SceneShortInput
          value={answers.maskName}
          onChange={(v) => set('maskName', v)}
          placeholder="e.g. The Cynic, The Protector, The Perfectionist…"
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.maskName.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'talk_1') {
    const name = answers.maskName || 'this part'
    return (
      <SceneCard
        gmVoice="challenger"
        gmLine={`Turn toward ${name} now. Speak to it directly.`}
        prompt={`${name}, what do you want to create?`}
        tone="charged"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.desire}
          onChange={(v) => set('desire', v)}
          placeholder="What it wants…"
          rows={3}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.desire.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'talk_2') {
    return (
      <SceneCard
        gmVoice="challenger"
        gmLine="Push further."
        prompt="And if you got that — what would that get you?"
        tone="charged"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.desireOutcome}
          onChange={(v) => set('desireOutcome', v)}
          placeholder="The deeper thing it's reaching for…"
          rows={3}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.desireOutcome.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'talk_3') {
    const name = answers.maskName || 'this part'
    return (
      <SceneCard
        gmVoice="challenger"
        gmLine={`Let ${name} show you where it lives.`}
        prompt="What is life like for you right now?"
        tone="charged"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.lifeState}
          onChange={(v) => set('lifeState', v)}
          placeholder="What is it experiencing? What does its world feel like?"
          rows={3}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.lifeState.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'talk_4') {
    return (
      <SceneCard
        gmVoice="challenger"
        gmLine="Step back. Look at it with compassion now."
        prompt="What would have to be true for someone to feel this way?"
        tone="charged"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.rootCause}
          onChange={(v) => set('rootCause', v)}
          placeholder="The conditions that would produce this experience…"
          rows={3}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.rootCause.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'talk_5') {
    const name = answers.maskName || 'this part'
    return (
      <SceneCard
        gmVoice="challenger"
        gmLine="Almost there."
        prompt={`${name}, what do you fear?`}
        tone="charged"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.fear}
          onChange={(v) => set('fear', v)}
          placeholder="What it's protecting against…"
          rows={3}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.fear.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'be_1') {
    return (
      <SceneCard
        gmVoice="sage"
        gmLine="Now let it speak from within you. Don't think. Just speak."
        prompt="When I let this presence speak from inside me, it says…"
        tone="revelatory"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.interiorVoice}
          onChange={(v) => set('interiorVoice', v)}
          placeholder="Speak as it, from the inside…"
          rows={5}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.interiorVoice.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'be_2') {
    return (
      <SceneCard
        gmVoice="sage"
        gmLine="What just changed?"
        prompt="When I hold this presence with awareness, I notice…"
        tone="revelatory"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.integrationShift}
          onChange={(v) => set('integrationShift', v)}
          placeholder="What shifts when you hold it consciously…"
          rows={4}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.integrationShift.trim()}
          nextLabel="See the alchemy →"
        />
      </SceneCard>
    )
  }

  // ---------------------------------------------------------------------------
  // Emotional Alchemy Reveal
  // ---------------------------------------------------------------------------

  if (phase === 'alchemy') {
    const name = answers.maskName || 'this presence'
    const ALIGNED_ACTIONS: AlignedAction[] = ['Wake Up', 'Clean Up', 'Grow Up', 'Show Up']

    return (
      <div className="space-y-8">
        <div className="border-l-2 border-emerald-500/40 pl-4 py-1">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Integrator</span>
          <p className="text-zinc-400 text-sm mt-1 italic">
            The pattern is clear now. Here is what you were carrying — and what you can alchemize it into.
          </p>
        </div>

        {/* Dissatisfied state */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Dissatisfied State</p>
          <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-5 space-y-3">
            <div>
              <span className="text-xs text-zinc-600 font-mono">Carrying</span>
              <p className="text-zinc-200 text-sm mt-0.5">
                <span className="text-purple-300 font-medium">{name}</span>
              </p>
            </div>
            <div>
              <span className="text-xs text-zinc-600 font-mono">Wanted</span>
              <p className="text-zinc-400 text-sm mt-0.5">{answers.desire}</p>
            </div>
            <div>
              <span className="text-xs text-zinc-600 font-mono">Feared</span>
              <p className="text-zinc-400 text-sm mt-0.5">{answers.fear}</p>
            </div>
          </div>
        </div>

        {/* The arrow */}
        <div className="text-center text-zinc-700 text-2xl select-none">↓</div>

        {/* Satisfied state — choose aligned action */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Satisfied State — Choose your transformation</p>
          <div className="grid grid-cols-2 gap-3">
            {ALIGNED_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => setAlignedAction(action)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  alignedAction === action
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 text-zinc-400'
                }`}
              >
                <span className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-60">
                  {action}
                </span>
                <span className="text-sm">
                  {action === 'Wake Up' && 'See more clearly — shift perspective'}
                  {action === 'Clean Up' && 'Clear the charge — restore flow'}
                  {action === 'Grow Up' && 'Develop capacity — expand range'}
                  {action === 'Show Up' && 'Take action — engage fully'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {alignedAction && (
          <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4">
            <p className="text-emerald-300 text-sm">
              You are alchemizing <span className="font-medium">{name}&apos;s</span> charge through{' '}
              <span className="font-medium">{alignedAction}</span>.
            </p>
          </div>
        )}

        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!alignedAction}
          nextLabel="Choose what to do with this →"
        />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Artifact Dispatch
  // ---------------------------------------------------------------------------

  if (phase === 'artifact') {
    const name = answers.maskName || 'this presence'

    return (
      <div className="space-y-7">
        <div className="border-l-2 border-emerald-500/40 pl-4 py-1">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Integrator</span>
          <p className="text-zinc-400 text-sm mt-1 italic">
            The {alignedAction} is clear. Now: what do you want to do with what you&apos;ve found?
          </p>
        </div>

        <div>
          <p className="text-zinc-100 text-lg font-medium leading-relaxed">
            What are you alchemizing <span className="text-purple-300">{name}</span> into?
          </p>
        </div>

        {error && (
          <div className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ArtifactChoice
            title="Turn into Quest"
            description="Convert this charge into a playable quest in the game."
            color="amber"
            onClick={handleTurnIntoQuest}
            loading={isPending}
          />
          <ArtifactChoice
            title="Create a BAR"
            description="Crystallize this charge as a BAR — shareable, tradeable inspiration."
            color="purple"
            onClick={handleCreateBAR}
            loading={false}
          />
          <ArtifactChoice
            title={`Discover ${name}`}
            description="Name this presence as a daemon — a recurring pattern you can work with."
            color="indigo"
            onClick={handleDiscoverDaemon}
            loading={isPending}
          />
          <ArtifactChoice
            title="Fuel the System"
            description="Channel this energy directly into the collective game field."
            color="emerald"
            onClick={handleFuelSystem}
            loading={isPending}
          />
        </div>

        <ArtifactChoice
          title="Witness Note"
          description="Hold this without dispatch. The session is complete."
          color="zinc"
          onClick={handleSaveAndClose}
          loading={isPending}
        />

        <div className="pt-2">
          <button
            onClick={goBack}
            className="text-zinc-700 hover:text-zinc-500 text-sm transition-colors"
          >
            ← Back to alchemy
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// ArtifactChoice card
// ---------------------------------------------------------------------------

const COLOR_MAP = {
  amber: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 text-amber-300',
  purple: 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60 text-purple-300',
  indigo: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60 text-indigo-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 text-emerald-300',
  zinc: 'border-zinc-700/50 bg-zinc-900/50 hover:border-zinc-600 text-zinc-300',
} as const

function ArtifactChoice({
  title,
  description,
  color,
  onClick,
  loading,
}: {
  title: string
  description: string
  color: keyof typeof COLOR_MAP
  onClick: () => void
  loading: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`text-left p-5 rounded-xl border transition-all space-y-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${COLOR_MAP[color]}`}
    >
      <p className="font-medium text-sm">{title}</p>
      <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
    </button>
  )
}
