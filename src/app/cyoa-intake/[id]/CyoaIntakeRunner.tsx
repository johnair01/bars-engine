'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDailyCheckIn } from '@/actions/alchemy'
import { saveIntakeProgress, completeIntakeSession, launchSpokeAdventure } from '@/actions/cyoa-intake'
import type {
  IntakeAdventureData,
  IntakePassage,
  IntakePlaybookData,
  IntakeCheckInData,
  IntakeChoiceLogEntry,
  IntakeCheckInAnswers,
} from '@/lib/cyoa-intake/intakeSurface'
import type { EmotionChannel, AlchemyAltitude } from '@/lib/alchemy/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNELS: Array<{ key: EmotionChannel; label: string; sigil: string; hint: string }> = [
  { key: 'joy', label: 'Joy', sigil: '木', hint: 'Vitality, delight, love of the game' },
  { key: 'anger', label: 'Anger', sigil: '火', hint: 'Obstacle present, boundary met' },
  { key: 'neutrality', label: 'Neutral', sigil: '土', hint: 'Whole-system perspective' },
  { key: 'fear', label: 'Fear', sigil: '金', hint: 'Risk detected, excitement as opportunity' },
  { key: 'sadness', label: 'Sadness', sigil: '水', hint: 'Something I care about feels distant' },
]

const ALTITUDES: Array<{ key: AlchemyAltitude; label: string; hint: string }> = [
  { key: 'dissatisfied', label: 'Dissatisfied', hint: 'In the thick of it — tension, friction, or stuckness is present' },
  { key: 'neutral', label: 'Neutral', hint: 'Moving through — aware and engaged, neither pulled nor pushed' },
  { key: 'satisfied', label: 'Satisfied', hint: 'Clear and flowing — momentum, capacity, readiness' },
]

/** Human-readable label for a 1–10 stuckness rating (10 = most stuck). */
function satisfactionLabel(rating: number): string {
  if (rating <= 2) return 'High flow — clear, energised, resourced'
  if (rating <= 4) return 'Above centre — momentum building, capacity available'
  if (rating <= 6) return 'Mid-range — aware and moving, not yet at ease'
  if (rating <= 8) return 'Below centre — some drag, not yet flowing'
  return 'Quite stuck — significant friction or resistance present'
}

// ---------------------------------------------------------------------------
// Phase definition
// ---------------------------------------------------------------------------

/**
 * Phase flow:
 *   landing → checkin_step0 → checkin_altitude → passage → complete
 *
 * checkin_step0 is the combined "step 0" that captures BOTH the satisfaction
 * slider AND the emotion channel selector on a single screen.
 * checkin_altitude captures the intensity/depth of that channel.
 */
type Phase =
  | 'landing'
  | 'checkin_step0'    // step 0: satisfaction slider + channel selector (combined)
  | 'checkin_altitude' // step 1: altitude/intensity selector
  | 'passage'
  | 'complete'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type State = {
  phase: Phase
  // Check-in answers (populated during checkin_step0 / checkin_altitude)
  stucknessRating: number      // satisfaction slider value, 1–10
  channel: EmotionChannel | null
  altitude: AlchemyAltitude | null
  checkInSaved: boolean
  // Passage navigation
  currentNodeId: string | null
  passageHistory: string[]
  choiceLog: IntakeChoiceLogEntry[]
  // Saving
  saving: boolean
  saveError: string | null
  /**
   * Set after completeIntakeSession succeeds at the terminal passage.
   * Contains the new SpokeSession.id — used only client-side for display/routing.
   * The resolved gmFace + moveType are stored on SpokeSession server-side
   * and are intentionally NOT exposed here.
   */
  spokeSessionId: string | null
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  adventure: IntakeAdventureData
  playbook: IntakePlaybookData
  todayCheckIn: IntakeCheckInData
  playerId: string
  /**
   * CampaignPortal.id — resolved server-side from URL ?portalId= or adventure.campaignRef.
   * Required by completeIntakeSession to create the SpokeSession.
   * Null when no portal exists yet for this campaign (graceful degradation: intake
   * will still complete but gmFace/moveType resolution is skipped).
   */
  portalId: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function passageMap(passages: IntakePassage[]): Map<string, IntakePassage> {
  return new Map(passages.map((p) => [p.nodeId, p]))
}

function rehydrateState(
  playbook: IntakePlaybookData,
  todayCheckIn: IntakeCheckInData,
  adventure: IntakeAdventureData,
): Partial<State> {
  // If today's check-in already exists, treat it as done
  const checkInDone = !!todayCheckIn
  const checkIn: Partial<State> = checkInDone
    ? {
        stucknessRating: todayCheckIn!.stucknessRating,
        channel: todayCheckIn!.channel as EmotionChannel,
        altitude: todayCheckIn!.altitude as AlchemyAltitude,
        checkInSaved: true,
      }
    : {}

  // Rehydrate passage progress from playerAnswers
  if (playbook.playerAnswers) {
    try {
      const saved = JSON.parse(playbook.playerAnswers) as {
        currentPassageId?: string
        passageHistory?: string[]
        choiceLog?: IntakeChoiceLogEntry[]
        checkIn?: IntakeCheckInAnswers
      }

      const savedCheckIn = saved.checkIn
        ? {
            stucknessRating: saved.checkIn.stucknessRating,
            channel: saved.checkIn.channel as EmotionChannel,
            altitude: saved.checkIn.altitude as AlchemyAltitude,
            checkInSaved: true,
          }
        : {}

      return {
        ...checkIn,
        ...savedCheckIn,
        currentNodeId: saved.currentPassageId ?? adventure.startNodeId,
        passageHistory: saved.passageHistory ?? [],
        choiceLog: saved.choiceLog ?? [],
        phase: derivePhaseFromSaved({
          checkInDone: checkInDone || !!saved.checkIn,
          hasProgress: !!(saved.passageHistory?.length),
          completed: !!playbook.completedAt,
        }),
      }
    } catch {
      // fall through to defaults
    }
  }

  return {
    ...checkIn,
    phase: checkInDone ? 'passage' : 'landing',
    currentNodeId: adventure.startNodeId,
  }
}

function derivePhaseFromSaved({
  checkInDone,
  completed,
}: {
  checkInDone: boolean
  hasProgress?: boolean
  completed: boolean
}): Phase {
  if (completed) return 'complete'
  if (!checkInDone) return 'landing'
  return 'passage'
}

function CompleteScene({
  campaignRef,
  spokeSessionId,
  onContinue,
}: {
  campaignRef: string | null
  spokeSessionId: string | null
  onContinue: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [launchError, setLaunchError] = useState<string | null>(null)

  function handleLaunch() {
    if (!spokeSessionId) { onContinue(); return }
    setLaunchError(null)
    startTransition(async () => {
      const result = await launchSpokeAdventure(spokeSessionId)
      if ('url' in result) {
        router.push(result.url)
      } else {
        setLaunchError(result.error)
      }
    })
  }

  return (
    <div className="text-center space-y-6">
      <div className="text-5xl mb-4">✦</div>
      <h2 className="text-2xl font-bold text-stone-100">Your path has been read.</h2>
      <p className="text-stone-400 text-sm leading-relaxed max-w-sm mx-auto">
        The intake is complete. The journey you&apos;re being called toward is being prepared.
      </p>
      {campaignRef && (
        <p className="text-xs text-stone-500 max-w-xs mx-auto">
          You&apos;re part of the <span className="text-amber-500">{campaignRef}</span> campaign.
        </p>
      )}
      {launchError && (
        <p className="text-xs text-red-400">{launchError}</p>
      )}
      {spokeSessionId ? (
        <button
          type="button"
          onClick={handleLaunch}
          disabled={isPending}
          className="mt-6 px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-100 rounded-lg font-medium transition-colors"
        >
          {isPending ? 'Preparing your adventure…' : 'Begin your Adventure →'}
        </button>
      ) : campaignRef ? (
        <button
          type="button"
          onClick={() => router.push(`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`)}
          className="mt-6 px-8 py-3 bg-amber-700/80 hover:bg-amber-600 text-stone-100 rounded-lg font-medium transition-colors"
        >
          Enter the campaign hub →
        </button>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 px-8 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg font-medium transition-colors border border-stone-600"
        >
          Return to Dashboard
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CyoaIntakeRunner({ adventure, playbook, todayCheckIn, playerId, portalId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const pMap = passageMap(adventure.passages)

  const rehydrated = rehydrateState(playbook, todayCheckIn, adventure)

  const [state, setState] = useState<State>({
    phase: rehydrated.phase ?? 'landing',
    stucknessRating: rehydrated.stucknessRating ?? 5,
    channel: rehydrated.channel ?? null,
    altitude: rehydrated.altitude ?? null,
    checkInSaved: rehydrated.checkInSaved ?? false,
    currentNodeId: rehydrated.currentNodeId ?? adventure.startNodeId,
    passageHistory: rehydrated.passageHistory ?? [],
    choiceLog: rehydrated.choiceLog ?? [],
    saving: false,
    saveError: null,
    spokeSessionId: null,
  })

  // -------------------------------------------------------------------------
  // Transition helpers
  // -------------------------------------------------------------------------

  function advance(updates: Partial<State>) {
    setState((s) => ({ ...s, ...updates, saveError: null }))
  }

  // -------------------------------------------------------------------------
  // Check-in flow
  // -------------------------------------------------------------------------

  function handleBegin() {
    if (state.checkInSaved) {
      advance({ phase: 'passage' })
    } else {
      advance({ phase: 'checkin_step0' })
    }
  }

  /**
   * handleStep0Submit — called when the player completes step 0
   * (satisfaction slider + emotion channel selector on the same screen).
   * Stores both values in local wizard state and advances to checkin_altitude.
   * No server call is made here — values remain in local state.
   */
  function handleStep0Submit(rating: number, channel: EmotionChannel) {
    advance({ stucknessRating: rating, channel, phase: 'checkin_altitude' })
  }

  function handleAltitudeSubmit(altitude: AlchemyAltitude) {
    const channel = state.channel!
    advance({ altitude, saving: true })
    startTransition(async () => {
      try {
        await createDailyCheckIn(
          playerId,
          state.stucknessRating,
          channel,
          altitude,
          'intake_cyoa',
        )
        // Persist check-in into playbook answers
        await saveIntakeProgress(playbook.id, {
          currentPassageId: state.currentNodeId ?? adventure.startNodeId ?? '',
          passageHistory: state.passageHistory,
          choiceLog: state.choiceLog,
          checkIn: { stucknessRating: state.stucknessRating, channel, altitude },
        })
        advance({ altitude, checkInSaved: true, saving: false, phase: 'passage' })
      } catch (err) {
        advance({
          saving: false,
          saveError: err instanceof Error ? err.message : 'Failed to save check-in',
        })
      }
    })
  }

  // -------------------------------------------------------------------------
  // Passage navigation
  // -------------------------------------------------------------------------

  function handleChoice(passage: IntakePassage, choiceText: string, targetId: string) {
    const newHistory = [...state.passageHistory, passage.nodeId]
    const newLog: IntakeChoiceLogEntry[] = [
      ...state.choiceLog,
      { nodeId: passage.nodeId, choiceText, targetId },
    ]

    // Detect terminal passage — no outbound passage for targetId
    const nextPassage = pMap.get(targetId)
    if (!nextPassage) {
      // Terminal — save progress, then atomically resolve gmFace + create SpokeSession.
      //
      // terminalNodeId: the nodeId of the final passage displayed to the player.
      //   When targetId === '__terminal__' (Continue button on a leaf passage),
      //   the terminal is the current passage (passage.nodeId).
      //   When targetId is a non-existent nodeId, it IS the terminal destination.
      const terminalNodeId = targetId === '__terminal__' ? passage.nodeId : targetId

      advance({ passageHistory: newHistory, choiceLog: newLog, saving: true })
      startTransition(async () => {
        try {
          // Build check-in answers from current state (should always be set by this phase)
          const checkInAnswers: IntakeCheckInAnswers | undefined =
            state.checkInSaved && state.channel && state.altitude
              ? {
                  stucknessRating: state.stucknessRating,
                  channel: state.channel,
                  altitude: state.altitude,
                }
              : undefined

          // 1. Persist final passage position + full choice log
          await saveIntakeProgress(playbook.id, {
            currentPassageId: terminalNodeId,
            passageHistory: newHistory,
            choiceLog: newLog,
            checkIn: checkInAnswers,
          })

          // 2. Atomically resolve gmFace + moveType and create the SpokeSession.
          //    This is the only place completeIntakeSession is called — it handles:
          //      • SD weight accumulation via IntakeTemplate.routing (server-only)
          //      • AlchemyCheckIn upsert (idempotent)
          //      • SpokeSession creation with gmFace + moveType stored
          //      • PlayerPlaybook.completedAt + spokeSessionId linkage
          //    gmFace/moveType are NOT returned to the client — they live on SpokeSession.
          let completedSpokeSessionId: string | null = null
          if (portalId && checkInAnswers) {
            const result = await completeIntakeSession({
              portalId,
              playbookId: playbook.id,
              adventureId: adventure.id,
              choiceLog: newLog,
              passages: adventure.passages,
              terminalNodeId,
              checkIn: checkInAnswers,
            })
            if ('success' in result && result.success) {
              completedSpokeSessionId = result.spokeSessionId
            }
            // If completeIntakeSession returns an error (e.g. already completed,
            // portal not found), we still advance to the complete screen —
            // graceful degradation ensures the player is not stuck.
          }

          advance({ saving: false, phase: 'complete', spokeSessionId: completedSpokeSessionId })
        } catch (err) {
          advance({
            saving: false,
            saveError: err instanceof Error ? err.message : 'Failed to complete intake',
          })
        }
      })
      return
    }

    // Non-terminal — move to next passage and persist
    advance({
      currentNodeId: targetId,
      passageHistory: newHistory,
      choiceLog: newLog,
      saving: true,
    })
    startTransition(async () => {
      try {
        await saveIntakeProgress(playbook.id, {
          currentPassageId: targetId,
          passageHistory: newHistory,
          choiceLog: newLog,
          checkIn: state.checkInSaved
            ? {
                stucknessRating: state.stucknessRating,
                channel: state.channel!,
                altitude: state.altitude!,
              }
            : undefined,
        })
        advance({ saving: false })
      } catch (err) {
        advance({
          saving: false,
          saveError: err instanceof Error ? err.message : 'Failed to save progress',
        })
      }
    })
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const currentPassage = state.currentNodeId ? pMap.get(state.currentNodeId) : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4">
        <p className="text-xs uppercase tracking-widest text-stone-500">
          {adventure.campaignRef ? `Campaign · ${adventure.campaignRef}` : 'Intake'}
        </p>
        <h1 className="text-lg font-semibold text-stone-200 mt-0.5">{adventure.title}</h1>
      </header>

      {/* Progress indicator */}
      <div className="px-6 pt-4">
        <ProgressBar
          phase={state.phase}
          totalPassages={adventure.passages.length}
          seenPassages={state.passageHistory.length}
        />
      </div>

      {/* Phase rendering */}
      <main className="max-w-xl mx-auto px-6 py-10">
        {state.saveError && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-700/50 rounded text-red-300 text-sm">
            {state.saveError}
          </div>
        )}

        {state.phase === 'landing' && (
          <LandingScene
            title={adventure.title}
            description={adventure.description}
            checkInDone={state.checkInSaved}
            onBegin={handleBegin}
          />
        )}

        {state.phase === 'checkin_step0' && (
          <CheckInStep0Scene
            initialRating={state.stucknessRating}
            initialChannel={state.channel}
            onSubmit={handleStep0Submit}
          />
        )}

        {state.phase === 'checkin_altitude' && state.channel && (
          <AltitudeScene
            channel={state.channel}
            saving={state.saving}
            onSubmit={handleAltitudeSubmit}
          />
        )}

        {state.phase === 'passage' && (
          <>
            {currentPassage ? (
              <PassageScene
                passage={currentPassage}
                saving={state.saving || isPending}
                onChoice={handleChoice}
              />
            ) : (
              <div className="text-stone-400 text-center py-16">
                <p className="text-sm">No passages found for this adventure.</p>
                <p className="text-xs mt-2 text-stone-600">
                  Start node: {adventure.startNodeId ?? 'not set'}
                </p>
              </div>
            )}
          </>
        )}

        {state.phase === 'complete' && (
          <CompleteScene
            campaignRef={adventure.campaignRef}
            spokeSessionId={state.spokeSessionId}
            onContinue={() => router.push('/')}
          />
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({
  phase,
  totalPassages,
  seenPassages,
}: {
  phase: Phase
  totalPassages: number
  seenPassages: number
}) {
  // Phase order: landing → checkin_step0 → checkin_altitude → passage → complete
  const phaseOrder: Phase[] = [
    'landing',
    'checkin_step0',
    'checkin_altitude',
    'passage',
    'complete',
  ]
  const phaseIdx = phaseOrder.indexOf(phase)
  // Check-in spans 2 steps (step0 + altitude); then passage steps; then complete
  const checkInSteps = 2
  const totalSteps = checkInSteps + Math.max(1, totalPassages) + 1
  const completedSteps =
    phase === 'complete'
      ? totalSteps
      : phaseIdx <= 2 // still in landing or check-in
      ? phaseIdx
      : checkInSteps + seenPassages

  const pct = Math.round((completedSteps / totalSteps) * 100)

  return (
    <div className="w-full bg-stone-800 rounded-full h-1">
      <div
        className="bg-amber-500 h-1 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function LandingScene({
  title,
  description,
  checkInDone,
  onBegin,
}: {
  title: string
  description: string | null
  checkInDone: boolean
  onBegin: () => void
}) {
  return (
    <div className="text-center space-y-6">
      <div className="text-5xl mb-4">🌀</div>
      <h2 className="text-2xl font-bold text-stone-100">{title}</h2>
      {description && (
        <p className="text-stone-400 text-sm leading-relaxed max-w-sm mx-auto">{description}</p>
      )}
      {!checkInDone && (
        <p className="text-xs text-stone-500 max-w-xs mx-auto">
          You'll start with a short emotional check-in to calibrate the journey.
        </p>
      )}
      <button
        onClick={onBegin}
        className="mt-6 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-stone-100 rounded-lg font-medium transition-colors"
      >
        {checkInDone ? 'Continue Journey' : 'Begin'}
      </button>
    </div>
  )
}

/**
 * CheckInStep0Scene — Step 0 of the intake CYOA wizard.
 *
 * Renders a single screen with both:
 *   1. A satisfaction slider (1–10, stored as stucknessRating in wizard state)
 *   2. An emotion channel selector (5 Wuxing channels)
 *
 * Both values are captured here and stored in local wizard state via onSubmit
 * before the wizard advances to checkin_altitude. No server calls are made in
 * this step — values live in local React state until the altitude step commits.
 */
function CheckInStep0Scene({
  initialRating,
  initialChannel,
  onSubmit,
}: {
  initialRating: number
  initialChannel: EmotionChannel | null
  onSubmit: (rating: number, channel: EmotionChannel) => void
}) {
  const [rating, setRating] = useState(initialRating)
  const [channel, setChannel] = useState<EmotionChannel | null>(initialChannel)

  const canContinue = channel !== null

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-amber-500 mb-2">Check-in · Step 0</p>
        <h2 className="text-xl font-semibold text-stone-100">Where are you arriving from?</h2>
        <p className="text-stone-400 text-sm mt-2">
          A quick read of your inner weather before the journey begins — no right answers.
        </p>
      </div>

      {/* ── Satisfaction slider ─────────────────────────────────────────── */}
      <section className="space-y-4" aria-labelledby="satisfaction-label">
        <div>
          <h3
            id="satisfaction-label"
            className="text-sm font-medium text-stone-300"
          >
            Satisfaction right now
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            1 = full flow &nbsp;·&nbsp; 10 = very stuck
          </p>
        </div>

        {/* Slider track with flanking labels */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Flow</span>
            <span className="text-2xl font-bold text-stone-100 tabular-nums">{rating}</span>
            <span>Stuck</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            aria-label="Satisfaction level"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={rating}
            className="w-full h-2 rounded-full accent-amber-500 cursor-pointer"
          />
          {/* Tick marks */}
          <div className="flex justify-between px-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <span
                key={n}
                className={`text-[10px] tabular-nums ${
                  n === rating ? 'text-amber-400 font-bold' : 'text-stone-700'
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Descriptive label for current value */}
        <p className="text-xs text-stone-500 italic leading-relaxed">
          {satisfactionLabel(rating)}
        </p>
      </section>

      {/* ── Emotion channel selector ────────────────────────────────────── */}
      <section className="space-y-4" aria-labelledby="channel-label">
        <div>
          <h3
            id="channel-label"
            className="text-sm font-medium text-stone-300"
          >
            What emotion is most present?
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Not necessarily negative — just the primary texture of your inner weather.
          </p>
        </div>

        <div className="space-y-2" role="radiogroup" aria-labelledby="channel-label">
          {CHANNELS.map((c) => {
            const isSelected = channel === c.key
            return (
              <button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setChannel(c.key)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-900/20 text-stone-100'
                    : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500 hover:text-stone-300'
                }`}
              >
                <span className="font-mono text-amber-600 mr-2 text-sm">{c.sigil}</span>
                <span className="font-medium text-stone-300 mr-2">{c.label}</span>
                <span className="text-xs text-stone-500">— {c.hint}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Continue ────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => canContinue && onSubmit(rating, channel!)}
        disabled={!canContinue}
        className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-100 rounded-lg font-medium transition-colors"
      >
        Continue →
      </button>
    </div>
  )
}

function AltitudeScene({
  channel,
  saving,
  onSubmit,
}: {
  channel: EmotionChannel
  saving: boolean
  onSubmit: (altitude: AlchemyAltitude) => void
}) {
  const [selected, setSelected] = useState<AlchemyAltitude | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-amber-500 mb-2">Check-in · Step 1</p>
        <h2 className="text-xl font-semibold text-stone-100">
          At what intensity is that {channel} present?
        </h2>
        <p className="text-stone-400 text-sm mt-2">
          Think of altitude as how resourced or squeezed you feel within this channel.
        </p>
      </div>

      <div className="space-y-3">
        {ALTITUDES.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setSelected(a.key)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              selected === a.key
                ? 'border-amber-500 bg-amber-900/20 text-stone-100'
                : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500'
            }`}
          >
            <span className="font-medium text-stone-300 block">{a.label}</span>
            <span className="text-xs text-stone-500">{a.hint}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => selected && onSubmit(selected)}
        disabled={!selected || saving}
        className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-100 rounded-lg font-medium transition-colors"
      >
        {saving ? 'Saving…' : 'Begin the Adventure →'}
      </button>
    </div>
  )
}

function PassageScene({
  passage,
  saving,
  onChoice,
}: {
  passage: IntakePassage
  saving: boolean
  onChoice: (passage: IntakePassage, choiceText: string, targetId: string) => void
}) {
  return (
    <div className="space-y-8">
      {/* Passage text */}
      <div className="prose prose-invert prose-sm max-w-none">
        <div className="text-stone-200 leading-relaxed whitespace-pre-wrap text-base">
          {passage.text}
        </div>
      </div>

      {/* Choices */}
      {passage.choices.length > 0 ? (
        <div className="space-y-3">
          {passage.choices.map((choice, i) => (
            <button
              key={`${choice.targetId}-${i}`}
              type="button"
              onClick={() => !saving && onChoice(passage, choice.text, choice.targetId)}
              disabled={saving}
              className={`w-full text-left px-5 py-4 rounded-lg border transition-all group ${
                saving
                  ? 'border-stone-700 bg-stone-900 opacity-50 cursor-not-allowed'
                  : 'border-stone-700 bg-stone-900 hover:border-amber-600/60 hover:bg-amber-900/10 text-stone-300 hover:text-stone-100 cursor-pointer'
              }`}
            >
              <span className="text-amber-600 font-mono text-xs mr-3 group-hover:text-amber-400">
                {String.fromCharCode(65 + i)}
              </span>
              {choice.text}
            </button>
          ))}
        </div>
      ) : (
        /* Terminal passage with no choices — show a "Continue" to trigger completion */
        <button
          type="button"
          onClick={() => onChoice(passage, '[end]', '__terminal__')}
          disabled={saving}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-100 rounded-lg font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      )}

      {saving && (
        <p className="text-center text-xs text-stone-500 animate-pulse">Saving your path…</p>
      )}
    </div>
  )
}
