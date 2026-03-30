'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SceneCard, SceneInput, SceneShortInput, SceneNav } from '@/components/scene-card/SceneCard'
import { fuelSystemFrom321, persist321Session } from '@/actions/charge-metabolism'
import { stashQuestWizardPrefillFrom321 } from '@/lib/quest-wizard-prefill'
import { awakenDaemonFrom321 } from '@/actions/daemons'
import { deriveShadowName } from '@/lib/shadow-name-grammar'
import { computeShadow321NameFields } from '@/lib/shadow321-name-resolution'
import { deriveMetadata321, deriveBarDraftFrom321 } from '@/lib/quest-grammar'
import { logShadowNameFeedback } from '@/actions/shadow-name-feedback'
import { usePostActionRouter } from '@/hooks/usePostActionRouter'
import { NAV } from '@/lib/navigation-contract'
import { ArtifactCeremony } from '@/components/shadow/ArtifactCeremony'
import { createCyoaDraftFrom321 } from '@/actions/cyoa-generator'
import { PrivacyBadge } from '@/components/ui/PrivacyBadge'
// ---------------------------------------------------------------------------
// Feeling chip vocabulary — Wuxing neutral + satisfied
// ---------------------------------------------------------------------------

type FeelingChip = {
  label: string
  channel: 'wood' | 'fire' | 'earth' | 'metal' | 'water'
  altitude: 'neutral' | 'satisfied'
}

const FEELING_CHIPS: FeelingChip[] = [
  { label: 'purposeful', channel: 'wood', altitude: 'neutral' },
  { label: 'generative', channel: 'wood', altitude: 'satisfied' },
  { label: 'open', channel: 'fire', altitude: 'neutral' },
  { label: 'expansive', channel: 'fire', altitude: 'satisfied' },
  { label: 'grounded', channel: 'earth', altitude: 'neutral' },
  { label: 'centered', channel: 'earth', altitude: 'satisfied' },
  { label: 'tender', channel: 'metal', altitude: 'neutral' },
  { label: 'released', channel: 'metal', altitude: 'satisfied' },
  { label: 'discerning', channel: 'water', altitude: 'neutral' },
  { label: 'trusting', channel: 'water', altitude: 'satisfied' },
]

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
  desireOutcome: string      // what it gets from that (raw unprimed text)
  desireFeelingTags: FeelingChip[] // structured feeling chips (up to 2, selected after text)
  lifeState: string          // what life is like for it
  rootCause: string          // what would have to be true
  fear: string               // what it fears
  // Phase 1: Be It (1st person)
  interiorVoice: string      // speaking as the mask from within
  integrationShift: string   // what shifts when held with awareness
  // Deep Cavern
  somaticEcho: string        // where it sits in the body and its final truth
  // Alchemy integration
  desiredFeeling: string     // "how would you want to feel?" — free text at alchemy phase
  desiredFeelingTags: FeelingChip[] // structured chips at alchemy phase (up to 2)
}

type Phase =
  | 'pre_flight'      // choose your guide NPC
  | 'face_1'          // describe the charge
  | 'face_2'          // give it a shape
  | 'face_3'          // give it a name
  | 'talk_1'          // what does it want
  | 'talk_2'          // what does it get from that
  | 'talk_3'          // what is life like for it
  | 'talk_4'          // what would have to be true
  | 'talk_5'          // what does it fear
  | 'ritual_choice'   // node: choice between fast path and deep cavern
  | 'deep_cavern'     // somatic immersion (branch only)
  | 'be_1'            // let it speak from within
  | 'be_2'            // what shifts
  | 'alchemy'         // emotional alchemy reveal — dissatisfied state
  | 'alchemy_feeling' // how would you want to feel? — desired state
  | 'artifact'        // dispatch: quest, BAR, daemon, fuel, save
  | 'done'

const PHASE_ORDER: Phase[] = [
  'pre_flight',
  'face_1', 'face_2', 'face_3',
  'talk_1', 'talk_2', 'talk_3', 'talk_4', 'talk_5',
  'ritual_choice',
  'deep_cavern',
  'be_1', 'be_2',
  'alchemy',
  'alchemy_feeling',
  'artifact',
]

const DISCOVERY_PHASES: Phase[] = [
  'face_1', 'face_2', 'face_3',
  'talk_1', 'talk_2', 'talk_3', 'talk_4', 'talk_5',
  'ritual_choice',
  'deep_cavern',
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
  /** Committed move from charge capture (wakeUp | cleanUp | growUp | showUp) */
  initialPersonalMove?: string
  /** When 321 was opened from a charge_capture BAR — compost charge on metabolizing outcomes (NEV). */
  chargeBarId?: string | null
}

// ---------------------------------------------------------------------------
// NPC Guides for the Descent
// ---------------------------------------------------------------------------

type NPCGuide = {
  id: string
  name: string
  face: 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'
  tagline: string
  description: string
  color: string
}

const NPC_GUIDES: NPCGuide[] = [
  {
    id: 'vorm',
    name: 'Vorm the Master Architect',
    face: 'architect',
    tagline: 'Precision for the Forge',
    description: 'The ancient sys-admin of the Silver City. He sees the world as logic and systems waiting to be solved.',
    color: 'text-orange-400',
  },
  {
    id: 'ignis',
    name: 'Ignis the Unbroken',
    face: 'challenger',
    tagline: 'Passion through Friction',
    description: 'The gardener of fire. He does not coddle; he tests your commitment to the flame.',
    color: 'text-red-400',
  },
  {
    id: 'aurelius',
    name: 'Aurelius the Law-Giver',
    face: 'regent',
    tagline: 'Balance at Noon',
    description: 'The architect of fair exchange. He believes order is the only shield against chaos.',
    color: 'text-amber-400',
  },
  {
    id: 'sola',
    name: 'Sola the Heart of Lamenth',
    face: 'diplomat',
    tagline: 'Beauty in Tragedy',
    description: 'The finder of meaning. She translates the poignance of existence into relational power.',
    color: 'text-emerald-400',
  },
  {
    id: 'kaelen',
    name: 'Kaelen the Moon-Caller',
    face: 'shaman',
    tagline: 'Spontaneous Growth',
    description: 'The mythic bridge-builder. He speaks in riddles of growth and joy, inviting you to descend.',
    color: 'text-purple-400',
  },
  {
    id: 'witness',
    name: 'The Witness',
    face: 'sage',
    tagline: 'The Meta-Observer',
    description: 'The one who has worn every mask. The Sage synthesizes the whole world into a single choice.',
    color: 'text-indigo-400',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SESSION_KEY = 'shadow321_progress'

function loadSession(): { phase: Phase; alignedAction: AlignedAction | ''; answers: Answers } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { phase: Phase; alignedAction: AlignedAction | ''; answers: Answers }
  } catch {
    return null
  }
}

function clearSession() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_KEY)
}

export function Shadow321Runner({
  playerId,
  initialCharge,
  returnTo,
  initialPersonalMove,
  chargeBarId,
}: Props) {
  const router = useRouter()
  const contextualReturn = returnTo ?? '/'
  const daemonRouter = usePostActionRouter(NAV['321_daemon'], contextualReturn)
  const fuelRouter = usePostActionRouter(NAV['321_fuel'], contextualReturn)
  const witnessRouter = usePostActionRouter(NAV['321_witness'], contextualReturn)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ceremony, setCeremony] = useState<{
    type: 'quest' | 'daemon' | 'fuel' | 'witness'
    name?: string
    onContinue: () => void
  } | null>(null)
  // Tracks the last name produced by "Suggest name" — used for feedback (accepted vs edited)
  const lastSuggestedNameRef = useRef<string | null>(null)
  /** Next index for deriveShadowName attempt (0 = legacy first suggestion; incremented after each click). */
  const suggestionAttemptRef = useRef(0)

  // Restore from sessionStorage on mount if available
  const saved = typeof window !== 'undefined' ? loadSession() : null
  const [phase, setPhase] = useState<Phase>(saved?.phase ?? 'pre_flight')
  const [guideId, setGuideId] = useState<string | null>(null)
  const PERSONAL_MOVE_TO_ALIGNED: Record<string, AlignedAction> = {
    wakeUp: 'Wake Up', cleanUp: 'Clean Up', growUp: 'Grow Up', showUp: 'Show Up',
  }
  const defaultAlignedAction: AlignedAction | '' = saved?.alignedAction ??
    (initialPersonalMove ? (PERSONAL_MOVE_TO_ALIGNED[initialPersonalMove] ?? '') : '')
  const [alignedAction, setAlignedAction] = useState<AlignedAction | ''>(defaultAlignedAction)
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {
    chargeDescription: initialCharge ?? '',
    maskShape: '',
    maskName: '',
    desire: '',
    desireOutcome: '',
    desireFeelingTags: [],
    lifeState: '',
    rootCause: '',
    fear: '',
    interiorVoice: '',
    integrationShift: '',
    somaticEcho: '',
    desiredFeeling: '',
    desiredFeelingTags: [],
  })
  const [sessionPath, setSessionPath] = useState<'fast' | 'deep' | null>(null)

  useEffect(() => {
    if (phase === 'done') return
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ phase, alignedAction, answers, sessionPath }))
    } catch {
      // storage full or private mode — silently ignore
    }
  }, [phase, alignedAction, answers, sessionPath])

  /**
   * Lightweight signal computed from session answers to trigger the Ritual Fork.
   */
  const depthSignal = computeDepthSignal(answers)

  function computeDepthSignal(ans: Answers) {
    const fields = [
      ans.chargeDescription,
      ans.maskShape,
      ans.desire,
      ans.lifeState,
      ans.fear,
    ]
    const totalChars = fields.reduce((sum, f) => sum + f.length, 0)
    const avgLen = totalChars / (fields.length || 1)

    const deepKeywords = ['fear', 'shame', 'pain', 'body', 'soul', 'never', 'always', 'truth', 'hide', 'trauma', 'dark']
    const text = (ans.chargeDescription + ans.desire + ans.fear).toLowerCase()
    const keywordCount = deepKeywords.reduce((count, word) => {
      const occurrences = text.split(word).length - 1
      return count + occurrences
    }, 0)

    // Score threshold for "Deep Cavern" offer
    const score = (avgLen / 50) + (keywordCount * 0.5)
    
    if (score > 3.5) return 'deep'
    if (score > 1.5) return 'engaged'
    return 'surface'
  }

  // Reset multi-suggest counter when charge or mask source text changes (user went back and edited)
  useEffect(() => {
    suggestionAttemptRef.current = 0
  }, [answers.chargeDescription, answers.maskShape])

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function set(key: keyof Answers, val: string) {
    setAnswers((prev) => ({ ...prev, [key]: val }))
  }

  function goNext() {
    if (phase === 'ritual_choice') {
      if (sessionPath === 'deep') {
        setPhase('deep_cavern')
      } else {
        setPhase('be_1')
      }
      return
    }

    if (phase === 'deep_cavern') {
      setPhase('be_1')
      return
    }

    const idx = PHASE_ORDER.indexOf(phase)
    if (idx < PHASE_ORDER.length - 1) {
      const next = PHASE_ORDER[idx + 1]
      // Skip deep_cavern if proceeding from ritual_choice (handled above)
      // or if somehow we land on it without deep path
      if (next === 'deep_cavern' && phase !== 'ritual_choice') {
        setPhase('be_1')
      } else {
        setPhase(next)
      }
    }
  }

  function goBack() {
    if (phase === 'be_1') {
      if (sessionPath === 'deep') {
        setPhase('deep_cavern')
      } else {
        setPhase('ritual_choice')
      }
      return
    }

    if (phase === 'deep_cavern') {
      setPhase('ritual_choice')
      return
    }

    const idx = PHASE_ORDER.indexOf(phase)
    if (idx > 0) {
      const prev = PHASE_ORDER[idx - 1]
      // Skip ritual_choice/deep_cavern if going back from talk_5
      // Wait, PHASE_ORDER has talk_5, ritual_choice, deep_cavern, be_1...
      setPhase(prev)
    }
  }

  const discoveryProgress = DISCOVERY_PHASES.includes(phase)
    ? { current: DISCOVERY_PHASES.indexOf(phase), total: DISCOVERY_PHASES.length }
    : undefined

  /** Persisted on Shadow321Session when present (Phase 6). Uses refs + mask field at call time. */
  function shadow321NameForPersist() {
    return computeShadow321NameFields(
      answers.maskName,
      lastSuggestedNameRef.current,
      suggestionAttemptRef.current
    )
  }

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

  /** Tweet-like draft for Create BAR path (BDE). Quest path still uses `buildMetadata`. */
  function buildBarDraftForCreateBar() {
    const phase3 = { identityFreeText: [answers.maskShape, answers.maskName].filter(Boolean).join(' — ') }
    const phase2 = {
      q1: answers.chargeDescription,
      q2: [] as string[],
      q3: answers.lifeState,
      q4: [] as string[],
      q5: answers.rootCause,
      q6: [] as string[],
      alignedAction: alignedAction || undefined,
    }
    return deriveBarDraftFrom321(
      phase3,
      phase2,
      { identification: answers.maskName, integration: answers.integrationShift },
      undefined,
      {
        phase2Snapshot: JSON.stringify(phase2),
        phase3Snapshot: JSON.stringify(phase3),
        shadow321Name: shadow321NameForPersist(),
      }
    )
  }

  // -------------------------------------------------------------------------
  // Artifact dispatch handlers
  // -------------------------------------------------------------------------

  function handleTurnIntoQuest() {
    setError(null)
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
    stashQuestWizardPrefillFrom321({
      version: 1,
      metadata,
      phase2,
      phase3,
      shadow321Name: shadow321NameForPersist(),
      displayHints: {
        chargeLine: answers.chargeDescription?.trim() || '',
        maskPresence: [answers.maskShape, answers.maskName].filter(Boolean).join(' — '),
        alignedAction: alignedAction || (initialPersonalMove ? (PERSONAL_MOVE_TO_ALIGNED[initialPersonalMove] ?? '') : ''),
        integrationShift: answers.integrationShift?.trim() || undefined,
      },
    })
    clearSession()
    import('sonner').then(({ toast }) => toast.success('Opening Quest Wizard with your 321…'))
    router.push('/quest/create?from=321')
  }

  function handleFuelSystem() {
    setError(null)
    startTransition(async () => {
      const metadata = buildMetadata()
      const res = await fuelSystemFrom321(metadata, undefined, shadow321NameForPersist(), chargeBarId ?? undefined)
      if (res && 'error' in res) {
        setError(res.error)
      } else if (res?.success) {
        clearSession()
        setCeremony({
          type: 'fuel',
          onContinue: () => fuelRouter.navigate({}),
        })
      }
    })
  }

  function handleCreateBAR() {
    if (typeof window !== 'undefined') {
      const draft = buildBarDraftForCreateBar()
      sessionStorage.setItem(
        'shadow321_metadata',
        JSON.stringify({
          title: draft.systemTitle,
          description: draft.body,
          tags: draft.tags,
          linkedQuestId: draft.linkedQuestId,
          source321FullText: draft.source321FullText,
          moveType: draft.moveType ?? undefined,
          systemTitle: draft.systemTitle,
          barDraftFrom321: true,
        })
      )
      sessionStorage.setItem(
        'shadow321_session',
        JSON.stringify({
          phase3Snapshot: draft.phase3Snapshot,
          phase2Snapshot: draft.phase2Snapshot,
          shadow321Name: draft.shadow321Name,
        })
      )
    }
    import('sonner').then(({ toast }) => toast.success('Taking you to create your BAR. Your 321 draft is ready.'))
    // Keep shadow321_progress until BAR is saved or user discards — reversible return to artifact step
    router.push('/create-bar?from321=1')
  }

  function handleDiscoverDaemon() {
    setError(null)
    startTransition(async () => {
      const phase2 = {
        q1: answers.chargeDescription,
        q3: answers.lifeState,
        q5: answers.rootCause,
        alignedAction: alignedAction || undefined,
      }
      const res = await awakenDaemonFrom321({
        playerId,
        phase2Snapshot: JSON.stringify(phase2),
        phase3Snapshot: JSON.stringify({
          identityFreeText: [answers.maskShape, answers.maskName].filter(Boolean).join(' — '),
        }),
        daemonName: answers.maskName || `From: ${answers.chargeDescription.slice(0, 30)}`,
        shadow321Name: shadow321NameForPersist(),
        chargeSourceBarId: chargeBarId ?? undefined,
      })
      if (res.error) {
        setError(res.error)
      } else {
        clearSession()
        setCeremony({
          type: 'daemon',
          name: answers.maskName || undefined,
          onContinue: () => daemonRouter.navigate({}),
        })
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
        shadow321Name: shadow321NameForPersist(),
      })
      clearSession()
      setCeremony({
        type: 'witness',
        onContinue: () => witnessRouter.navigate({}),
      })
    })
  }

  function handleDevelopStory() {
    setError(null)
    startTransition(async () => {
      const metadata = deriveMetadata321(phase3, phase2, phase1)
      const result = await createCyoaDraftFrom321({
        metadata: {
          title: metadata.title,
          description: metadata.description,
          tags: []
        },
        phase2: { q1: answers.chargeDescription, q3: answers.lifeState, q5: answers.rootCause, alignedAction },
        phase3: { identityFreeText: [answers.maskShape, answers.maskName].filter(Boolean).join(' — ') },
        shadow321Name: shadow321NameForPersist(),
      })

      if ('error' in result) {
        setError(result.error as string)
      } else {
        router.push(`/cyoa/generate?draftId=${result.id}`)
      }
    })
  }


  // -------------------------------------------------------------------------
  // Render — scene cards
  // -------------------------------------------------------------------------

  if (ceremony) {
    return (
      <ArtifactCeremony
        artifactType={ceremony.type}
        artifactName={ceremony.name}
        onContinue={ceremony.onContinue}
      />
    )
  }

  if (phase === 'pre_flight') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium text-zinc-100 tracking-tight">Who is guiding this descent?</h2>
          <p className="text-sm text-zinc-500 max-w-md">
            The 321 is a ritual extraction. Choose a Game Master to witness your shadows and forge your outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NPC_GUIDES.map((npc) => (
            <button
              key={npc.id}
              onClick={() => {
                setGuideId(npc.id)
                goNext()
              }}
              className="group relative p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-left hover:border-zinc-500 hover:bg-zinc-800/50 transition-all duration-300"
            >
              <div className={`text-xs font-mono uppercase tracking-widest mb-1 ${npc.color} opacity-80`}>
                {npc.tagline}
              </div>
              <div className="text-lg font-medium text-zinc-200 group-hover:text-white transition-colors">
                {npc.name}
              </div>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                {npc.description}
              </p>
              <div className="absolute top-4 right-4 text-zinc-700 group-hover:text-zinc-400 transition-colors">
                →
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const selectedGuide = NPC_GUIDES.find((n) => n.id === guideId) ?? NPC_GUIDES[4] // Default to Kaelen

  if (phase === 'face_1') {
    return (
      <SceneCard
        gmVoice={selectedGuide.face}
        gmLine={`${selectedGuide.name} acknowledges your entry. "Something has your attention. Let's find out what it is."`}
        prompt="There is something I'm carrying. When I sit with it, I notice…"
        subtext={
          <>
            Write freely. This stays private. <PrivacyBadge />
          </>
        }
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
        gmVoice={selectedGuide.face}
        gmLine="Let it take form outside of you. If this were a presence — a figure, a creature, an energy — what would it be?"
        prompt="If I look at this thing closely, I see…"
        subtext={`${selectedGuide.name} waits for the form to stabilize.`}
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
    const hasInput = answers.chargeDescription.trim() && answers.maskShape.trim()
    function handleSuggestName() {
      if (!hasInput) return
      setError(null)
      try {
        const attempt = suggestionAttemptRef.current
        const name = deriveShadowName(answers.chargeDescription, answers.maskShape, attempt)
        lastSuggestedNameRef.current = name
        set('maskName', name)
        suggestionAttemptRef.current = attempt + 1
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not suggest name')
      }
    }
    function handleNextWithFeedback() {
      const suggested = lastSuggestedNameRef.current
      if (suggested) {
        const accepted = answers.maskName.trim() === suggested
        void logShadowNameFeedback({
          chargeDescription: answers.chargeDescription,
          maskShape: answers.maskShape,
          suggestedName: suggested,
          accepted,
          editedTo: accepted ? undefined : answers.maskName.trim() || undefined,
        })
      }
      goNext()
    }
    return (
      <SceneCard
        gmVoice={selectedGuide.face}
        gmLine="A form needs a name. Not a clinical label, but a name that fits its nature. What do we call this part of you?"
        prompt="I'll call this part of me…"
        subtext={`${selectedGuide.name} listens for the naming.`}
        tone="contemplative"
        progress={discoveryProgress}
      >
        <div className="space-y-2">
          <SceneShortInput
            value={answers.maskName}
            onChange={(v) => set('maskName', v)}
            placeholder="e.g. The Cynic, The Protector, The Perfectionist…"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSuggestName}
            disabled={!hasInput}
            className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ✨ Suggest name
          </button>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
        <SceneNav
          onBack={goBack}
          onNext={handleNextWithFeedback}
          nextDisabled={!answers.maskName.trim()}
        />
      </SceneCard>
    )
  }

  if (phase === 'talk_1') {
    const name = answers.maskName || 'this part'
    return (
      <SceneCard
        gmVoice={selectedGuide.face}
        gmLine={`Now we speak to ${name}. Ask it simply: what do you want from me?`}
        prompt="The Part says: I want…"
        subtext={`${selectedGuide.name} watches the dialogue begin.`}
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
        gmVoice={selectedGuide.face}
        gmLine="And if you got that, truly and fully... what would you have then?"
        prompt="If I got that, then I would have…"
        subtext={`${selectedGuide.name} probes for the deeper grain.`}
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
        gmVoice={selectedGuide.face}
        gmLine={`What is it like to be ${name} right now? How does it see your life?`}
        prompt="From the perspective of this part, life is…"
        subtext={`${selectedGuide.name} shifts the lens.`}
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
        gmVoice={selectedGuide.face}
        gmLine="What would have to be true for this part to feel completely safe and settled?"
        prompt="For this part to be settled, it would need…"
        subtext={`${selectedGuide.name} looks for the requirements of peace.`}
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
        gmVoice={selectedGuide.face}
        gmLine="One last question for it: At the very bottom of everything, what is it you're most afraid would happen?"
        prompt="At the bottom of it all, I am afraid that…"
        subtext={`${selectedGuide.name} acknowledges the fear.`}
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
          nextLabel="Enter the fork →"
        />
      </SceneCard>
    )
  }

  if (phase === 'ritual_choice') {
    const isDeep = depthSignal === 'deep'
    const isEngaged = depthSignal === 'engaged'

    const guideLines: Record<string, string> = {
      vorm: isDeep 
        ? "The structural load of this reflection is high. I can synthesize it now, or we can map the internal resonance first."
        : "The pattern is stable. Choose your integration path.",
      ignis: isDeep
        ? "You've touched the heat. Do you want the furnace of action, or the deeper forge of the body?"
        : "Moving at speed. Do you want to strike now, or pause for the deeper truth?",
      aurelius: "The exchange is balanced. We may proceed to completion, or honor the somatic depth revealed here.",
      sola: "This poignance is heavy. Do we hold it here and finish, or descend into where it truly lives?",
      kaelen: "The moon calls you lower. Will you take the fast path of light, or the deep cavern of the somatic echo?",
      witness: "The observer sees two paths. The fast path upward, or the ritual descent into the physical vessel.",
    }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="border-l-2 border-indigo-500/40 pl-4 py-1">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">{selectedGuide.name}</span>
          <p className="text-zinc-400 text-sm mt-1 italic leading-relaxed">
            "{guideLines[selectedGuide.id] || "The moment of choice is here. How deep shall we go?"}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              setSessionPath('fast')
              goNext()
            }}
            className="text-left p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all group"
          >
            <p className="text-zinc-300 font-medium group-hover:text-white transition-colors">The Fast Path</p>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
              Ascend to the anabasis. Synthesize the findings into an artifact immediately.
            </p>
            <p className="text-purple-400 text-[10px] uppercase tracking-widest mt-3">integration focus</p>
          </button>

          <button
            onClick={() => {
              setSessionPath('deep')
              goNext()
            }}
            className={`text-left p-6 rounded-2xl border transition-all group ${
              isDeep ? 'border-purple-500/40 bg-purple-500/5' : 'border-zinc-800 bg-zinc-900/50'
            } hover:border-purple-500/60`}
          >
            <div className="flex justify-between items-start">
              <p className="text-zinc-300 font-medium group-hover:text-white transition-colors">The Deep Cavern</p>
              {isDeep && (
                <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-tighter shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  offered
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
              Descend into the somatic echo. Find exactly where this shadow sits in the vessel of the body.
            </p>
            <p className="text-purple-400 text-[10px] uppercase tracking-widest mt-3">ritual focus</p>
          </button>
        </div>

        <SceneNav onBack={goBack} onNext={() => {}} />
      </div>
    )
  }

  if (phase === 'deep_cavern') {
    return (
      <SceneCard
        gmVoice={selectedGuide.face}
        gmLine="Now: let the masks fall. Where does this presence resonate in your physical vessel? Let it take up space."
        prompt={`Drop your attention into your body. Where do you feel ${answers.maskName || 'this presence'}?`}
        subtext={`${selectedGuide.name} holds the grounding field.`}
        tone="somatized"
        progress={discoveryProgress}
      >
        <SceneInput
          value={answers.somaticEcho}
          onChange={(v) => set('somaticEcho', v)}
          placeholder="I feel it in my..."
          rows={4}
          autoFocus
        />
        <SceneNav
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!answers.somaticEcho.trim()}
          nextLabel="Own the presence →"
        />
      </SceneCard>
    )
  }

  if (phase === 'be_1') {
    return (
      <SceneCard
        gmVoice={selectedGuide.face}
        gmLine={`Time to inhabit the mask. Drop the "it." Speak as ${answers.maskName} directly. "I am here, and I want you to know..."`}
        prompt="I am here, and I want you to know…"
        subtext={`${selectedGuide.name} witnesses the embodiment.`}
        tone="somatized"
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
        gmVoice={selectedGuide.face}
        gmLine="As you've given this part a voice and a face... what has shifted in your body? What feels different now?"
        prompt="When I hold this presence with awareness, I notice…"
        subtext={`${selectedGuide.name} scans the somatic field.`}
        tone="somatized"
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="border-l-2 border-emerald-500/40 pl-4 py-1">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">{selectedGuide.name}</span>
          <p className="text-zinc-400 text-sm mt-1 italic">
            "The pattern is clear now. Here is what you were carrying — and what you can alchemize it into."
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
                className={`p-4 rounded-xl border text-left transition-all ${alignedAction === action
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
          nextLabel="One more thing →"
        />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Desired Feeling — how would you want to feel?
  // ---------------------------------------------------------------------------

  if (phase === 'alchemy_feeling') {
    return (
      <AlchemyFeelingStep
        answers={answers}
        selectedGuide={selectedGuide}
        onUpdate={(desiredFeeling, desiredFeelingTags) =>
          setAnswers((prev) => ({ ...prev, desiredFeeling, desiredFeelingTags }))
        }
        onBack={goBack}
        onNext={goNext}
      />
    )
  }

  // ---------------------------------------------------------------------------
  // Artifact Dispatch
  // ---------------------------------------------------------------------------

  if (phase === 'artifact') {
    const name = answers.maskName || 'this presence'

    return (
      <div className="space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="border-l-2 border-emerald-500/40 pl-4 py-1">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">{selectedGuide.name}</span>
          <p className="text-zinc-400 text-sm mt-1 italic">
            "The {alignedAction} is clear. Now: what do you want to do with what you&apos;ve found?"
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
            description="Open the Quest Wizard with your 321 prefilled — publish a metabolizable quest."
            color="amber"
            onClick={handleTurnIntoQuest}
            loading={false}
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
          <ArtifactChoice
            title="Develop Story"
            description="Weave this charge into a branching Choose Your Own Adventure narrative."
            color="indigo"
            onClick={handleDevelopStory}
            loading={false}
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
// AlchemyFeelingStep — "If you had all that — how would you want to feel?"
// Researcher pattern: question alone first → quiet input → chips after pause
// ---------------------------------------------------------------------------

function AlchemyFeelingStep({
  answers,
  selectedGuide,
  onUpdate,
  onBack,
  onNext,
}: {
  answers: Answers
  selectedGuide: NPCGuide
  onUpdate: (text: string, tags: FeelingChip[]) => void
  onBack: () => void
  onNext: () => void
}) {
  const [text, setText] = useState(answers.desiredFeeling)
  const [tags, setTags] = useState<FeelingChip[]>(answers.desiredFeelingTags)
  const [showChips, setShowChips] = useState(false)
  const [inputVisible, setInputVisible] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTyped = useRef<number>(0)

  // Input fades in after 1.5s
  useEffect(() => {
    const t = setTimeout(() => setInputVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // Chips appear after 5s of no typing
  useEffect(() => {
    if (!inputVisible) return
    if (showChips) return
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setShowChips(true), 5000)
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current) }
  }, [text, inputVisible, showChips])

  const handleText = (val: string) => {
    setText(val)
    lastTyped.current = Date.now()
    onUpdate(val, tags)
    // Reset idle timer on typing
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (!showChips) {
      idleTimer.current = setTimeout(() => setShowChips(true), 5000)
    }
  }

  const toggleChip = (chip: FeelingChip) => {
    const already = tags.some((t) => t.label === chip.label)
    let next: FeelingChip[]
    if (already) {
      next = tags.filter((t) => t.label !== chip.label)
    } else if (tags.length < 2) {
      next = [...tags, chip]
    } else {
      // Replace second chip
      next = [tags[0], chip]
    }
    setTags(next)
    onUpdate(text, next)
  }

  const name = answers.maskName || 'this presence'
  const contextual = tags.length > 0
    ? `What does "${tags.map((t) => t.label).join('" or "')}" feel like for you?`
    : 'Name the feeling, or a few words…'

  return (
    <div className="space-y-8">
      <div className="border-l-2 border-indigo-500/40 pl-4 py-1">
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">{selectedGuide.name}</span>
        <p className="text-zinc-400 text-sm mt-1 italic">
          "You&apos;ve seen what {name} was reaching for."
        </p>
      </div>

      <p className="text-zinc-100 text-xl font-medium leading-relaxed">
        If you got all of that — how would you want to feel?
      </p>

      {inputVisible && (
        <div className="space-y-3 animate-in fade-in duration-700">
          <textarea
            value={text}
            onChange={(e) => handleText(e.target.value)}
            placeholder={contextual}
            rows={3}
            autoFocus
            className="w-full bg-transparent border-0 border-b border-zinc-800 focus:border-indigo-500/60 outline-none text-zinc-200 text-base resize-none placeholder-zinc-700 pb-2 transition-colors"
          />

          {!showChips && (
            <button
              onClick={() => setShowChips(true)}
              className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors"
            >
              help me find the word →
            </button>
          )}
        </div>
      )}

      {showChips && (
        <div className="space-y-3 animate-in fade-in duration-500">
          <p className="text-xs text-zinc-600 italic">
            Words others have used at this moment — does anything land?
          </p>
          <div className="flex flex-wrap gap-2">
            {FEELING_CHIPS.map((chip) => {
              const active = tags.some((t) => t.label === chip.label)
              return (
                <button
                  key={chip.label}
                  onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${active
                    ? 'bg-indigo-600/30 border border-indigo-500/60 text-indigo-200'
                    : 'border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
          {tags.length > 0 && (
            <p className="text-[11px] text-zinc-700 italic">
              Your words still matter most — keep writing if this isn&apos;t quite right.
            </p>
          )}
        </div>
      )}

      <SceneNav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!text.trim() && tags.length === 0}
        nextLabel="Choose what to do with this →"
      />
    </div>
  )
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
