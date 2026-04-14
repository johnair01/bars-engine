'use client'

/**
 * AlchemyArcRunner — 3-phase CYOA arc orchestrator
 *
 * Wires the Intake → Action → Reflection arc flow with phase-locked state
 * advancement. Each phase:
 *   1. Receives output from the previous phase
 *   2. Calls the corresponding server action to create a channel-typed BAR
 *   3. Passes its BAR result to the next phase
 *
 * Phase wiring:
 *   Intake → completeIntakePhase() → intakeBarId → ActionPhaseStep
 *   Action → completeActionPhase() → actionBarId → ReflectionPhaseStep
 *   Reflection → completeReflectionPhase() → reflectionBarId (= epiphany artifact)
 *
 * Key invariants:
 *   - Phase-locked: regulation advances only on phase completion
 *   - Epiphany IS the Reflection BAR (no separate Epiphany model)
 *   - Non-AI path is first-class: CYOA selections, no AI required
 *   - Vertical slice: Challenger face + Wake Up WAVE move only
 *
 * @see src/actions/alchemy-engine.ts — server actions for each phase
 * @see src/lib/alchemy-engine/types.ts — PHASE_REGULATION_MAP, vertical slice
 */

import { useState, useTransition, useCallback, useEffect } from 'react'
import { IntakePhaseStep, type IntakePhaseState } from './IntakePhaseStep'
import { ActionPhaseStep, type ActionPhaseState } from './ActionPhaseStep'
import { ReflectionPhaseStep, type ReflectionPhaseState, type ReflectionCompletion } from './ReflectionPhaseStep'
import type { PassageContent } from './PassageNarrative'
import {
  startAlchemyArc,
  completeIntakePhase,
  completeActionPhase,
  completeReflectionPhase,
  resolvePhasePassage,
  generateReflectionOptions,
  type IntakeCompletionResult,
  type ActionCompletionResult,
  type ReflectionCompletionResult,
  type ResolvedPassageResult,
} from '@/actions/alchemy-engine'
import type { ArcPhase, RegulationState } from '@/lib/alchemy-engine/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { CultivationCard } from '@/components/ui/CultivationCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The runner's internal view of arc progression. */
interface ArcProgress {
  /** Current phase in the arc */
  phase: ArcPhase | 'start' | 'complete'
  /** Current regulation state */
  regulation: RegulationState
  /** Emotional channel for this arc */
  channel: EmotionalChannel
  /** BAR IDs produced by each completed phase */
  barIds: {
    intake?: string
    action?: string
    reflection?: string
  }
  /** Output from completed phases (passed forward) */
  phaseOutputs: {
    intake?: IntakePhaseState
    action?: ActionPhaseState
  }
  /** Error message from the last failed operation */
  error?: string
}

/**
 * Resolved passage content for each phase, fetched from the AI/static pipeline.
 * Stored separately from ArcProgress to avoid re-renders on passage fetch.
 */
interface PhasePassageState {
  /** Resolved content per phase */
  content: Partial<Record<ArcPhase, PassageContent | null>>
  /** Loading state per phase */
  loading: Partial<Record<ArcPhase, boolean>>
  /** AI-generated reflection completions (replaces defaults when available) */
  reflectionCompletions?: ReflectionCompletion[]
}

/** Props for the arc runner */
export interface AlchemyArcRunnerProps {
  /** Emotional channel for this arc (selected before arc starts) */
  channel: EmotionalChannel
  /** Existing arc state to resume from (optional) */
  initialPhase?: ArcPhase
  initialRegulation?: RegulationState
  /** Callback when the arc is fully complete */
  onArcComplete?: (result: {
    intakeBarId: string
    actionBarId: string
    reflectionBarId: string
    channel: EmotionalChannel
  }) => void
  /** Callback on error */
  onError?: (error: string) => void
}

// ---------------------------------------------------------------------------
// Channel display helpers
// ---------------------------------------------------------------------------

const CHANNEL_DISPLAY: Record<string, string> = {
  Fear: 'Fear',
  Anger: 'Anger',
  Sadness: 'Sadness',
  Joy: 'Joy',
  Neutrality: 'Neutrality',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AlchemyArcRunner({
  channel,
  initialPhase,
  initialRegulation,
  onArcComplete,
  onError,
}: AlchemyArcRunnerProps) {
  const [isPending, startTransition] = useTransition()

  const [arc, setArc] = useState<ArcProgress>(() => ({
    phase: initialPhase ?? 'start',
    regulation: initialRegulation ?? 'dissatisfied',
    channel,
    barIds: {},
    phaseOutputs: {},
  }))

  // ─── Passage content state (AI/static) ──────────────────────────────────
  const [passages, setPassages] = useState<PhasePassageState>({
    content: {},
    loading: {},
  })

  const fireTokens = ELEMENT_TOKENS.fire

  // ─── Fetch passage content when phase changes ────────────────────────────
  // This effect triggers on phase transitions to fetch AI-generated or static
  // passage content. It runs AFTER the phase advances, so the server action
  // can read the player's current state and prior BARs.
  useEffect(() => {
    const currentPhase = arc.phase
    if (currentPhase === 'start' || currentPhase === 'complete') return
    // Don't re-fetch if we already have content for this phase
    if (passages.content[currentPhase] !== undefined) return
    if (passages.loading[currentPhase]) return

    // Mark as loading
    setPassages((prev) => ({
      ...prev,
      loading: { ...prev.loading, [currentPhase]: true },
    }))

    // Fetch passage content (non-blocking — doesn't gate phase rendering)
    resolvePhasePassage(currentPhase).then((result: ResolvedPassageResult) => {
      if (result.success && result.situation && result.friction && result.invitation) {
        const passageContent: PassageContent = {
          situation: result.situation,
          friction: result.friction,
          invitation: result.invitation,
          source: (result.source as PassageContent['source']) ?? 'static_inline',
          aiAvailable: result.aiAvailable ?? false,
        }
        setPassages((prev) => ({
          ...prev,
          content: { ...prev.content, [currentPhase]: passageContent },
          loading: { ...prev.loading, [currentPhase]: false },
        }))
      } else {
        // Resolution failed — set null (components fall back to hardcoded text)
        setPassages((prev) => ({
          ...prev,
          content: { ...prev.content, [currentPhase]: null },
          loading: { ...prev.loading, [currentPhase]: false },
        }))
      }
    }).catch(() => {
      setPassages((prev) => ({
        ...prev,
        content: { ...prev.content, [currentPhase]: null },
        loading: { ...prev.loading, [currentPhase]: false },
      }))
    })

    // For reflection phase, also fetch AI-generated completion options
    if (currentPhase === 'reflection') {
      generateReflectionOptions(true).then((optResult) => {
        if (optResult.success && optResult.completions?.suggestions) {
          const aiCompletions: ReflectionCompletion[] = optResult.completions.suggestions.map((s) => ({
            id: s.key,
            title: s.title,
            content: s.body,
            tone: s.framing === 'direct' ? 'confrontational' as const
              : s.framing === 'generative' ? 'integrative' as const
              : 'transcendent' as const,
            source: 'ai' as const,
          }))
          setPassages((prev) => ({
            ...prev,
            reflectionCompletions: aiCompletions,
          }))
        }
        // If AI completions fail, component uses DEFAULT_CHALLENGER_REFLECTIONS (non-AI first-class)
      }).catch(() => {
        // Silently fail — non-AI completions are the default path
      })
    }
  }, [arc.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase handlers ──────────────────────────────────────────────────────

  /**
   * Start the arc — initializes server-side state.
   */
  const handleStartArc = useCallback(() => {
    startTransition(async () => {
      const result = await startAlchemyArc(channel)
      if (!result.success) {
        setArc((prev) => ({ ...prev, error: result.error }))
        onError?.(result.error ?? 'Failed to start arc')
        return
      }
      setArc((prev) => ({
        ...prev,
        phase: result.arcPhase ?? 'intake',
        regulation: result.regulation ?? 'dissatisfied',
        error: undefined,
      }))
    })
  }, [channel, onError])

  /**
   * Handle Intake phase completion.
   *
   * Flow:
   *   1. Receives IntakePhaseState from IntakePhaseStep
   *   2. Calls completeIntakePhase() server action → creates Intake BAR
   *   3. Stores intakeBarId and intake output
   *   4. Advances to Action phase (regulation: dissatisfied → neutral)
   *   5. Intake output is now available for Action phase context
   */
  const handleIntakeComplete = useCallback((intakeState: IntakePhaseState) => {
    startTransition(async () => {
      const result: IntakeCompletionResult = await completeIntakePhase(
        intakeState.content,
        intakeState.title,
      )

      if (!result.success) {
        setArc((prev) => ({ ...prev, error: result.error }))
        onError?.(result.error ?? 'Failed to complete intake')
        return
      }

      setArc((prev) => ({
        ...prev,
        phase: result.advance?.newPhase ?? 'action',
        regulation: result.advance?.newRegulation ?? 'neutral',
        barIds: { ...prev.barIds, intake: result.barId },
        phaseOutputs: { ...prev.phaseOutputs, intake: intakeState },
        error: undefined,
      }))
    })
  }, [onError])

  /**
   * Handle Action phase completion.
   *
   * Flow:
   *   1. Receives ActionPhaseState from ActionPhaseStep (move selection + response)
   *   2. Calls completeActionPhase() server action → creates Action BAR
   *   3. Stores actionBarId and action output
   *   4. Advances to Reflection phase (regulation stays neutral)
   *   5. Action BAR result flows to Reflection phase for aggregation
   *
   * The Action phase received Intake output implicitly through the server-side
   * arc state — the AlchemyPlayerState tracks the current phase/regulation,
   * and the Intake BAR is available for the Reflection aggregator.
   */
  const handleActionComplete = useCallback((actionState: ActionPhaseState) => {
    startTransition(async () => {
      const result: ActionCompletionResult = await completeActionPhase(
        actionState.selectedMove.id,
        actionState.response,
      )

      if (!result.success) {
        setArc((prev) => ({ ...prev, error: result.error }))
        onError?.(result.error ?? 'Failed to complete action')
        return
      }

      setArc((prev) => ({
        ...prev,
        phase: result.advance?.newPhase ?? 'reflection',
        regulation: result.advance?.newRegulation ?? 'neutral',
        barIds: { ...prev.barIds, action: result.barId },
        phaseOutputs: { ...prev.phaseOutputs, action: actionState },
        error: undefined,
      }))
    })
  }, [onError])

  /**
   * Handle Reflection phase completion.
   *
   * Flow:
   *   1. Receives ReflectionPhaseState from ReflectionPhaseStep
   *   2. Calls completeReflectionPhase() → creates Reflection BAR (= epiphany)
   *   3. The Reflection BAR is channel-typed to the stabilized channel
   *   4. Advances regulation: neutral → satisfied (arc complete)
   *   5. Fires onArcComplete with all 3 BAR IDs
   *
   * The Reflection phase has access to Intake + Action output through:
   *   - Server-side: aggregateReflectionContext() reads prior BARs
   *   - Client-side: phaseOutputs carries the in-memory state
   */
  const handleReflectionComplete = useCallback((reflectionState: ReflectionPhaseState) => {
    startTransition(async () => {
      // Build provenance metadata from the ReflectionPhaseState.
      // This tracks HOW the player created their reflection: CYOA selection,
      // customized edit, or freeform writing. Persisted in the BAR's strandMetadata.
      const reflectionSource: {
        mode: 'cyoa' | 'freeform'
        selectedCompletionId?: string
        isCustomized?: boolean
      } = {
        mode: reflectionState.mode,
        ...(reflectionState.selectedCompletionId
          ? { selectedCompletionId: reflectionState.selectedCompletionId }
          : {}),
        ...(reflectionState.isCustomized !== undefined
          ? { isCustomized: reflectionState.isCustomized }
          : {}),
      }

      const result: ReflectionCompletionResult = await completeReflectionPhase(
        reflectionState.content,
        reflectionState.title,
        reflectionSource,
      )

      if (!result.success) {
        setArc((prev) => ({ ...prev, error: result.error }))
        onError?.(result.error ?? 'Failed to complete reflection')
        return
      }

      setArc((prev) => {
        const newBarIds = { ...prev.barIds, reflection: result.barId }
        return {
          ...prev,
          phase: 'complete' as const,
          regulation: result.advance?.newRegulation ?? 'satisfied',
          barIds: newBarIds,
          error: undefined,
        }
      })

      // Fire completion callback with all BAR IDs
      onArcComplete?.({
        intakeBarId: arc.barIds.intake!,
        actionBarId: arc.barIds.action!,
        reflectionBarId: result.barId!,
        channel,
      })
    })
  }, [arc.barIds.intake, arc.barIds.action, channel, onArcComplete, onError])

  // ─── Render: Start screen ────────────────────────────────────────────────

  if (arc.phase === 'start') {
    return (
      <CultivationCard
        element="fire"
        altitude="dissatisfied"
        stage="growing"
        className="p-5"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Alchemy Arc · Challenger + Wake Up
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              Begin the arc
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Three phases. One transformation.<br />
              <span className="text-zinc-500">
                Intake → Action → Reflection<br />
                dissatisfied → neutral → epiphany
              </span>
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Channel: <span className={fireTokens.textAccent}>{CHANNEL_DISPLAY[channel] ?? channel}</span>
            </p>
          </div>

          {arc.error && (
            <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-3">
              <p className="text-xs text-red-300">{arc.error}</p>
            </div>
          )}

          <button
            onClick={handleStartArc}
            disabled={isPending}
            className={`
              w-full py-2.5 rounded-lg text-sm font-medium transition
              bg-gradient-to-r from-orange-700/80 to-red-700/80
              border ${fireTokens.border}
              ${fireTokens.textAccent}
              hover:from-orange-600/80 hover:to-red-600/80
              active:scale-[0.98]
              disabled:opacity-40 disabled:pointer-events-none
            `}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-orange-300/40 border-t-orange-300 rounded-full animate-spin" />
                Starting...
              </span>
            ) : (
              'Enter the arc →'
            )}
          </button>
        </div>
      </CultivationCard>
    )
  }

  // ─── Render: Intake phase ────────────────────────────────────────────────

  if (arc.phase === 'intake') {
    return (
      <div className="space-y-3">
        <ArcProgressBar currentPhase="intake" regulation={arc.regulation} />
        <IntakePhaseStep
          currentAltitude={arc.regulation as AlchemyAltitude}
          channelName={CHANNEL_DISPLAY[channel]}
          isPending={isPending}
          onComplete={handleIntakeComplete}
          passageContent={passages.content.intake ?? null}
          isLoadingPassage={passages.loading.intake ?? false}
        />
        {arc.error && <ErrorBanner message={arc.error} />}
      </div>
    )
  }

  // ─── Render: Action phase ────────────────────────────────────────────────
  // Action receives Intake output implicitly: the server-side state has
  // advanced to 'action' phase with 'neutral' regulation, proving intake
  // completed. The IntakePhaseState is also available in arc.phaseOutputs.

  if (arc.phase === 'action') {
    return (
      <div className="space-y-3">
        <ArcProgressBar currentPhase="action" regulation={arc.regulation} />
        {/* Context: show what was named in Intake */}
        {arc.phaseOutputs.intake && (
          <IntakeContextBanner intake={arc.phaseOutputs.intake} />
        )}
        <ActionPhaseStep
          currentAltitude={arc.regulation as AlchemyAltitude}
          isPending={isPending}
          onComplete={handleActionComplete}
          onBack={undefined} // No going back — phase is locked
          passageContent={passages.content.action ?? null}
          isLoadingPassage={passages.loading.action ?? false}
        />
        {arc.error && <ErrorBanner message={arc.error} />}
      </div>
    )
  }

  // ─── Render: Reflection phase ────────────────────────────────────────────
  // Reflection receives Action output: the Action BAR has been created and
  // its ID stored. The reflection aggregator will read both Intake + Action
  // BARs server-side to build the full reflection context.

  if (arc.phase === 'reflection') {
    return (
      <div className="space-y-3">
        <ArcProgressBar currentPhase="reflection" regulation={arc.regulation} />
        {/* Context: show the arc journey so far */}
        {arc.phaseOutputs.intake && arc.phaseOutputs.action && (
          <ArcJourneySummary
            intake={arc.phaseOutputs.intake}
            action={arc.phaseOutputs.action}
            channel={channel}
          />
        )}
        <ReflectionPhaseStep
          currentAltitude={arc.regulation as AlchemyAltitude}
          channelName={CHANNEL_DISPLAY[channel]}
          isPending={isPending}
          onComplete={handleReflectionComplete}
          onBack={undefined} // No going back — phase is locked
          passageContent={passages.content.reflection ?? null}
          isLoadingPassage={passages.loading.reflection ?? false}
          completions={passages.reflectionCompletions}
        />
        {arc.error && <ErrorBanner message={arc.error} />}
      </div>
    )
  }

  // ─── Render: Arc complete ────────────────────────────────────────────────

  if (arc.phase === 'complete') {
    return (
      <CultivationCard
        element="fire"
        altitude="satisfied"
        stage="growing"
        ritual
        className="p-5"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Arc Complete · Epiphany Achieved
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              The Challenger witnesses your transformation
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Three BARs created. Your Reflection BAR is the epiphany artifact —
              a record of what you couldn&apos;t see before.
            </p>
          </div>

          {/* BAR summary */}
          <div className={`rounded-lg border ${fireTokens.border} ${fireTokens.bg} p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Artifacts produced</span>
              <span className="text-[10px] text-zinc-500">{CHANNEL_DISPLAY[channel]}</span>
            </div>
            <div className="space-y-1.5">
              {arc.barIds.intake && (
                <BarSummaryLine phase="intake" label="Intake BAR" barId={arc.barIds.intake} />
              )}
              {arc.barIds.action && (
                <BarSummaryLine phase="action" label="Action BAR" barId={arc.barIds.action} />
              )}
              {arc.barIds.reflection && (
                <BarSummaryLine phase="reflection" label="Reflection BAR (epiphany)" barId={arc.barIds.reflection} />
              )}
            </div>
            <div className="text-[10px] text-zinc-600 pt-1 border-t border-zinc-800/50">
              dissatisfied → neutral → satisfied
            </div>
          </div>
        </div>
      </CultivationCard>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Sub-components — small UI atoms for the runner
// ---------------------------------------------------------------------------

/** Progress bar showing the 3 phases of the arc */
function ArcProgressBar({
  currentPhase,
  regulation,
}: {
  currentPhase: ArcPhase
  regulation: RegulationState
}) {
  const phases: ArcPhase[] = ['intake', 'action', 'reflection']
  const currentIdx = phases.indexOf(currentPhase)

  return (
    <div className="flex items-center gap-1.5 px-1">
      {phases.map((phase, idx) => {
        const isActive = idx === currentIdx
        const isComplete = idx < currentIdx
        return (
          <div key={phase} className="flex items-center gap-1.5 flex-1">
            <div
              className={`
                h-1 flex-1 rounded-full transition-colors duration-300
                ${isComplete ? 'bg-orange-600/70' : isActive ? 'bg-orange-500/50' : 'bg-zinc-800'}
              `}
            />
            <span
              className={`
                text-[9px] uppercase tracking-wider shrink-0
                ${isActive ? 'text-orange-400' : isComplete ? 'text-orange-600/70' : 'text-zinc-700'}
              `}
            >
              {phase}
            </span>
          </div>
        )
      })}
      <span className="text-[9px] text-zinc-600 ml-1 shrink-0">
        {regulation}
      </span>
    </div>
  )
}

/** Shows what was named in Intake, displayed during Action phase */
function IntakeContextBanner({ intake }: { intake: IntakePhaseState }) {
  const fireTokens = ELEMENT_TOKENS.fire
  return (
    <div className={`rounded-lg border ${fireTokens.border} bg-zinc-900/40 px-3 py-2`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600">
          From Intake
        </span>
        <span className={`text-[10px] ${fireTokens.textAccent} opacity-70`}>
          {intake.title}
        </span>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 italic">
        &ldquo;{intake.content}&rdquo;
      </p>
    </div>
  )
}

/** Shows the full arc journey summary during Reflection phase */
function ArcJourneySummary({
  intake,
  action,
  channel,
}: {
  intake: IntakePhaseState
  action: ActionPhaseState
  channel: EmotionalChannel
}) {
  const fireTokens = ELEMENT_TOKENS.fire
  return (
    <div className={`rounded-lg border ${fireTokens.border} bg-zinc-900/40 px-3 py-2 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600">
          Your journey so far
        </span>
        <span className="text-[10px] text-zinc-600">
          {CHANNEL_DISPLAY[channel] ?? channel}
        </span>
      </div>
      <div className="space-y-1.5">
        <div>
          <span className="text-[10px] text-orange-500/70">Intake:</span>
          <span className="text-xs text-zinc-500 ml-1.5 italic line-clamp-1">
            {intake.content}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-orange-500/70">Action:</span>
          <span className="text-xs text-zinc-500 ml-1.5">
            {action.selectedMove.title}
          </span>
          <span className="text-xs text-zinc-600 ml-1 italic line-clamp-1">
            — &ldquo;{action.response}&rdquo;
          </span>
        </div>
      </div>
    </div>
  )
}

/** Error banner for displaying phase completion errors */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-3">
      <p className="text-xs text-red-300">{message}</p>
    </div>
  )
}

/** Single BAR line in the completion summary */
function BarSummaryLine({
  phase,
  label,
  barId,
}: {
  phase: string
  label: string
  barId: string
}) {
  const isEpiphany = phase === 'reflection'
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${isEpiphany ? 'text-orange-300 font-medium' : 'text-zinc-400'}`}>
        {label}
      </span>
      <span className="text-[10px] font-mono text-zinc-600">
        {barId.slice(0, 8)}...
      </span>
    </div>
  )
}
