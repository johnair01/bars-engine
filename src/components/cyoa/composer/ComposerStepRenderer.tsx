'use client'

/**
 * ComposerStepRenderer — Adaptive step renderer for the CYOA Composer.
 *
 * Consumes the `useComposerGating` hook output and conditionally renders
 * only branches that pass the visibility filter. Hidden branches are
 * never mounted — the renderer uses the gating result's `visible` flag
 * to decide what to render, not CSS display/opacity.
 *
 * The renderer is the universal UI component for the composer wizard.
 * It delegates to per-step sub-renderers (FaceSelectionStep,
 * NarrativeTemplateStep, etc.) but owns the gating consumption logic.
 *
 * Design:
 *   - One universal component — GM controls step order via overrides
 *   - Branches that fail the visibility filter are NOT rendered at all
 *   - Auto-resolved steps show a locked badge + auto-advance after a brief delay
 *   - Step progression follows the adaptive resolver's ordered active steps
 *   - Face affinity sorting applied when emotional vector is present
 *   - WAVE move options filtered by gating and rendered in narrative template step
 *   - Visibility summaries surfaced per step for player awareness
 *   - Emotional check-in consumes gating auto-resolution to skip when pre-filled
 *
 * @see src/hooks/useComposerGating.ts — gating hook this component consumes
 * @see src/lib/cyoa-composer/branch-visibility.ts — pure filtering engine
 * @see src/lib/cyoa-composer/adaptive-resolver.ts — step ordering + pre-fill
 */

import { useState, useCallback, useEffect } from 'react'
import type { GameMasterFace, PersonalMoveType } from '@/lib/quest-grammar/types'
import { FACE_META } from '@/lib/quest-grammar/types'
import type { ComposerDataBag, ComposerStepId, ResolvedStep } from '@/lib/cyoa-composer/types'
import type {
  FaceOption,
  NarrativeTemplateOption,
  WaveMoveOption,
  TemplateCatalogEntry,
  CampaignBranchConfig,
  StepVisibilitySummary,
} from '@/lib/cyoa-composer/branch-visibility'
import { useComposerGating, type ComposerGatingResult } from '@/hooks/useComposerGating'
import type { AdaptiveResolution, PrefilledSource } from '@/lib/cyoa-composer/adaptive-resolver'

// ─── Props ──────────────────────────────────────────────────────────────────

export interface ComposerStepRendererProps {
  /** Adaptive resolution result (step ordering + pre-filled data). */
  resolution: AdaptiveResolution
  /** Available narrative templates from the server-loaded registry. */
  templateCatalog: TemplateCatalogEntry[]
  /** Optional GM-configured branch restrictions. */
  campaignConfig?: CampaignBranchConfig
  /** Callback when a step is completed with new data. */
  onStepComplete: (stepId: ComposerStepId, data: Partial<ComposerDataBag>) => void
  /** Callback when the full build is confirmed (confirmation step). */
  onConfirm: (finalBag: ComposerDataBag) => void
  /** Optional: override which step is currently active (for external navigation). */
  activeStepIndex?: number
  /** Optional: callback when the active step changes. */
  onActiveStepChange?: (index: number) => void
}

// ─── Auto-resolve Delay ─────────────────────────────────────────────────────
// Brief delay before auto-advancing an auto-resolved step.
// Gives the player a moment to see what was locked before moving on.
const AUTO_RESOLVE_DELAY_MS = 600

// ─── Component ──────────────────────────────────────────────────────────────

export function ComposerStepRenderer({
  resolution,
  templateCatalog,
  campaignConfig,
  onStepComplete,
  onConfirm,
  activeStepIndex: controlledIndex,
  onActiveStepChange,
}: ComposerStepRendererProps) {
  const { resolvedBag, activeSteps, prefilledSources } = resolution

  // ── Internal step index (controlled or uncontrolled) ──────────────────
  const [internalIndex, setInternalIndex] = useState(0)
  const currentIndex = controlledIndex ?? internalIndex

  const setCurrentIndex = useCallback(
    (idx: number) => {
      if (onActiveStepChange) onActiveStepChange(idx)
      else setInternalIndex(idx)
    },
    [onActiveStepChange],
  )

  const currentStep = activeSteps[currentIndex] ?? null

  // ── Gating hook — the core branch-visibility consumer ─────────────────
  const gating = useComposerGating({
    lockedFace: resolvedBag.lockedFace ?? null,
    emotionalVector: resolvedBag.emotionalVector ?? null,
    dataBag: resolvedBag,
    templateCatalog,
    campaignConfig,
  })

  // ── Auto-resolve: when a step has exactly 1 visible option, auto-lock ─
  useEffect(() => {
    if (!currentStep) return
    if (!gating.isStepAutoResolved(currentStep.id)) return

    const autoValue = gating.getAutoResolvedValue(currentStep.id)
    if (autoValue == null) return

    const timer = setTimeout(() => {
      const data = autoResolveToData(currentStep.id, autoValue)
      if (data) {
        onStepComplete(currentStep.id, data)
        // Advance to next step
        if (currentIndex < activeSteps.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
      }
    }, AUTO_RESOLVE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [currentStep, gating, currentIndex, activeSteps.length, onStepComplete, setCurrentIndex])

  // ── Step completion handler ───────────────────────────────────────────
  const handleStepSelect = useCallback(
    (stepId: ComposerStepId, data: Partial<ComposerDataBag>) => {
      onStepComplete(stepId, data)
      // Advance to next step after selection
      if (currentIndex < activeSteps.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    },
    [onStepComplete, currentIndex, activeSteps.length, setCurrentIndex],
  )

  // ── Confirmation handler ──────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    onConfirm(resolvedBag)
  }, [onConfirm, resolvedBag])

  // ── Current step's visibility summary from gating ─────────────────────
  const currentStepSummary = currentStep
    ? gating.stepSummaries.find((s) => s.stepId === currentStep.id)
    : null

  // ── Progress bar ──────────────────────────────────────────────────────
  const totalSteps = activeSteps.length
  const progressPercent = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0

  // ── Render ────────────────────────────────────────────────────────────
  if (!currentStep) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <p>All steps complete. Ready to confirm.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress indicator */}
      <ComposerProgress
        steps={activeSteps}
        currentIndex={currentIndex}
        progressPercent={progressPercent}
        stepSummaries={gating.stepSummaries}
        dataBag={resolvedBag}
        onStepClick={setCurrentIndex}
      />

      {/* Step header with gating badges */}
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold text-zinc-100">
          {currentStep.label}
        </h2>
        {/* Sealed badge — shown when navigating back to a completed step */}
        {isStepCompleted(currentStep.id, resolvedBag) && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-zinc-800/70 text-zinc-400 border border-zinc-600/40">
            <LockIcon size={10} />
            Locked
          </span>
        )}
        {gating.isStepAutoResolved(currentStep.id) && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
            Auto-resolved
          </span>
        )}
        <PrefilledBadge stepId={currentStep.id} sources={prefilledSources} />
        {/* Visibility count: shows how many options remain after gating filter */}
        <VisibilityCount summary={currentStepSummary} />
      </div>

      {/* Step content — gating-filtered branches ONLY */}
      {/* Steps before the current index are sealed — their committed choices
          are rendered with lock icon + desaturated styling from cultivation-cards.css.
          The current step and future steps are open/interactive. */}
      <StepContent
        step={currentStep}
        gating={gating}
        dataBag={resolvedBag}
        onSelect={handleStepSelect}
        onConfirm={handleConfirm}
        isStepSealed={isStepCompleted(currentStep.id, resolvedBag)}
      />

      {/* Navigation */}
      <StepNavigation
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        onNext={() => setCurrentIndex(Math.min(totalSteps - 1, currentIndex + 1))}
        isLastStep={currentIndex === totalSteps - 1}
      />
    </div>
  )
}

// ─── Visibility Count Badge ────────────────────────────────────────────────

/**
 * Shows how many options passed the gating filter out of total available.
 * Only displays when some options are hidden (i.e. gating is active).
 */
function VisibilityCount({ summary }: { summary: StepVisibilitySummary | null | undefined }) {
  if (!summary) return null
  // Don't show for steps with only 1 option (free-text, confirmation)
  if (summary.totalOptions <= 1) return null
  // Don't show when all options are visible (no filtering active)
  if (summary.visibleOptions === summary.totalOptions) return null

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/40"
      title={`${summary.visibleOptions} of ${summary.totalOptions} options visible after filtering`}
    >
      {summary.visibleOptions}/{summary.totalOptions}
    </span>
  )
}

// ─── Step Content Dispatcher ────────────────────────────────────────────────

/**
 * Dispatches to the correct step renderer based on step ID.
 * Each sub-renderer receives ONLY visible branches from the gating result.
 * Hidden branches are never mounted — gating filters are applied before render.
 *
 * Steps that the player has already advanced past are rendered in "sealed"
 * mode — committed choices show with lock icon + desaturated border,
 * non-selected options are greyed out. This uses cultivation-cards.css
 * `.composer-option--sealed` and `.composer-option--sealed-selected` classes.
 */
function StepContent({
  step,
  gating,
  dataBag,
  onSelect,
  onConfirm,
  isStepSealed,
}: {
  step: ResolvedStep
  gating: ComposerGatingResult
  dataBag: ComposerDataBag
  onSelect: (stepId: ComposerStepId, data: Partial<ComposerDataBag>) => void
  onConfirm: () => void
  /** True when the player has advanced past this step — selections are locked. */
  isStepSealed: boolean
}) {
  switch (step.id) {
    case 'emotional_checkin':
      return (
        <EmotionalCheckinStep
          dataBag={dataBag}
          isAutoResolved={gating.isStepAutoResolved('emotional_checkin')}
          onSelect={onSelect}
          isSealed={isStepSealed}
        />
      )

    case 'face_selection':
      // Render ONLY gating-visible faces (affinity-sorted when vector present).
      // Hidden faces are never mounted — affinitySortedFaces contains only
      // faces that passed the visibility filter.
      return (
        <FaceSelectionStep
          visibleFaces={gating.affinitySortedFaces}
          selectedFace={dataBag.lockedFace}
          onSelect={(face) => onSelect('face_selection', { lockedFace: face })}
          isSealed={isStepSealed}
        />
      )

    case 'narrative_template':
      // Render ONLY gating-visible templates AND visible WAVE moves.
      // Templates filtered out by face or channel compatibility are never mounted.
      return (
        <NarrativeTemplateStep
          visibleTemplates={gating.visibleTemplates}
          visibleMoves={gating.visibleMoves}
          selectedTemplateId={dataBag.narrativeTemplateId}
          lockedFace={dataBag.lockedFace}
          onSelect={(templateId) => onSelect('narrative_template', { narrativeTemplateId: templateId })}
          isSealed={isStepSealed}
        />
      )

    case 'charge_text':
      return (
        <ChargeTextStep
          currentText={dataBag.chargeText}
          onSelect={(text) => onSelect('charge_text', { chargeText: text })}
          isSealed={isStepSealed}
        />
      )

    case 'confirmation':
      // Confirmation consumes gating for template label resolution
      // and isFullyConstrained check.
      return (
        <ConfirmationStep
          dataBag={dataBag}
          gating={gating}
          onConfirm={onConfirm}
        />
      )

    default:
      return null
  }
}

// ─── Face Selection Step ────────────────────────────────────────────────────

/**
 * Renders ONLY visible face options from the gating filter.
 * Hidden faces are never mounted — the gating hook's `affinitySortedFaces`
 * already contains only passing branches. The `visible` flag is always true
 * for items in this array.
 *
 * When `isSealed` is true, all options are rendered in sealed state:
 * the selected option gets `composer-option--sealed-selected` and
 * non-selected options get `composer-option--sealed`, both non-interactive
 * with desaturated styling. A lock icon appears on the committed choice.
 */
function FaceSelectionStep({
  visibleFaces,
  selectedFace,
  onSelect,
  isSealed = false,
}: {
  visibleFaces: FaceOption[]
  selectedFace?: GameMasterFace
  onSelect: (face: GameMasterFace) => void
  isSealed?: boolean
}) {
  if (visibleFaces.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500">
        <p>No faces available for this configuration.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {/* Only visible faces are rendered — hidden faces never enter this array */}
      {visibleFaces.map((option) => {
        const meta = FACE_META[option.face]
        const isSelected = selectedFace === option.face
        const sealedClass = isSealed
          ? isSelected
            ? 'composer-option--sealed-selected'
            : 'composer-option--sealed'
          : ''
        return (
          <button
            key={option.face}
            onClick={() => onSelect(option.face)}
            disabled={isSealed}
            className={`
              relative p-4 rounded-lg border transition-all duration-200
              text-left group
              ${sealedClass}
              ${!isSealed && isSelected
                ? 'border-white/40 bg-white/10 ring-1 ring-white/20'
                : !isSealed
                  ? 'border-zinc-700/50 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
                  : ''
              }
            `}
            aria-pressed={isSelected}
            aria-disabled={isSealed}
            aria-label={`${isSealed && isSelected ? 'Locked: ' : isSealed ? 'Sealed: ' : 'Select '}${meta.label} face: ${meta.role}`}
          >
            <div className={`text-sm font-bold ${meta.color} mb-1`}>
              {meta.label}
            </div>
            <div className="text-xs text-zinc-400 mb-2">
              {meta.role}
            </div>
            <div className="text-xs text-zinc-500 leading-relaxed">
              {meta.mission}
            </div>
            {/* Lock icon for sealed+selected (committed choice) */}
            {isSealed && isSelected && (
              <div className="absolute top-2 right-2 composer-lock-badge" aria-label="Locked selection">
                <LockIcon size={10} />
              </div>
            )}
            {/* Emerald dot for selected (non-sealed) */}
            {!isSealed && isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Narrative Template Step ────────────────────────────────────────────────

/**
 * Renders ONLY visible narrative template options AND visible WAVE moves.
 * Templates filtered out by face or channel compatibility are never mounted.
 * WAVE moves are filtered by gating — only visible moves are rendered.
 *
 * When `isSealed` is true, the committed template shows as sealed-selected
 * with a lock badge, and all other templates show as sealed (greyed/non-interactive).
 */
function NarrativeTemplateStep({
  visibleTemplates,
  visibleMoves,
  selectedTemplateId,
  lockedFace,
  onSelect,
  isSealed = false,
}: {
  visibleTemplates: NarrativeTemplateOption[]
  visibleMoves: WaveMoveOption[]
  selectedTemplateId?: string
  lockedFace?: GameMasterFace
  onSelect: (templateId: string) => void
  isSealed?: boolean
}) {
  if (visibleTemplates.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500">
        <p>No templates match your current selections.</p>
        <p className="text-xs mt-1">Try changing your face or emotional vector.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* WAVE move context — shows only gating-visible moves as orientation */}
      {visibleMoves.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-500">
            Available paths{lockedFace ? ` for ${FACE_META[lockedFace].label}` : ''}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {/* Only visible WAVE moves are rendered — filtered out moves never mount */}
            {visibleMoves.map((move) => (
              <span
                key={move.move}
                className="text-xs px-2 py-1 rounded bg-zinc-800/60 text-zinc-300 border border-zinc-700/40"
              >
                {move.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Template options — only gating-visible templates rendered */}
      <div className="flex flex-col gap-2">
        {visibleTemplates.map((option) => {
          const isSelected = selectedTemplateId === option.templateKey
          const sealedClass = isSealed
            ? isSelected
              ? 'composer-option--sealed-selected'
              : 'composer-option--sealed'
            : ''
          return (
            <button
              key={option.templateKey}
              onClick={() => onSelect(option.templateKey)}
              disabled={isSealed}
              className={`
                p-4 rounded-lg border transition-all duration-200
                text-left
                ${sealedClass}
                ${!isSealed && isSelected
                  ? 'border-white/40 bg-white/10 ring-1 ring-white/20'
                  : !isSealed
                    ? 'border-zinc-700/50 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
                    : ''
                }
              `}
              aria-pressed={isSelected}
              aria-disabled={isSealed}
              aria-label={`${isSealed && isSelected ? 'Locked: ' : isSealed ? 'Sealed: ' : 'Select template: '}${option.label}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-zinc-100">
                  {option.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Lock badge for sealed+selected (committed choice) */}
                  {isSealed && isSelected && (
                    <span className="composer-lock-badge" aria-label="Locked selection">
                      <LockIcon size={10} />
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded">
                    {option.templateKind}
                  </span>
                </div>
              </div>
              {option.compatibleFaces.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {option.compatibleFaces.map((face) => (
                    <span
                      key={face}
                      className={`text-xs px-1.5 py-0.5 rounded ${FACE_META[face].color} bg-zinc-800/60`}
                    >
                      {FACE_META[face].label}
                    </span>
                  ))}
                </div>
              )}
              {!isSealed && isSelected && (
                <div className="mt-2 text-xs text-emerald-400">Selected</div>
              )}
              {isSealed && isSelected && (
                <div className="mt-2 text-xs text-zinc-500">Committed</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Emotional Check-in Step ────────────────────────────────────────────────

/**
 * Emotional check-in for the composer. Consumes gating auto-resolution:
 * when gating reports this step is auto-resolved (pre-filled from daily check-in),
 * it shows a read-only summary instead of the full input form.
 *
 * When active (not auto-resolved), renders channel and altitude selectors.
 * These are free-form inputs (not branch options), so gating doesn't filter
 * them — but the step respects gating's auto-resolution signal.
 */
function EmotionalCheckinStep({
  dataBag,
  isAutoResolved,
  onSelect,
  isSealed = false,
}: {
  dataBag: ComposerDataBag
  isAutoResolved: boolean
  onSelect: (stepId: ComposerStepId, data: Partial<ComposerDataBag>) => void
  isSealed?: boolean
}) {
  const channels = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality'] as const
  const altitudes = ['dissatisfied', 'neutral', 'satisfied'] as const

  const [channel, setChannel] = useState(dataBag.channel ?? '')
  const [altitude, setAltitude] = useState(dataBag.altitude ?? '')

  const canSubmit = channel !== '' && altitude !== ''

  // Sealed state — show committed emotional vector with lock indicator
  if (isSealed && dataBag.emotionalVector) {
    return (
      <div className="rounded-lg border border-zinc-700/40 bg-zinc-900/40 p-4 composer-option--sealed-selected">
        <div className="flex items-center gap-2 mb-2">
          <span className="composer-lock-badge" aria-label="Locked selection">
            <LockIcon size={10} />
          </span>
          <span className="text-xs text-zinc-500">Committed</span>
        </div>
        <div className="text-sm text-zinc-300">
          {dataBag.channel && (
            <span className="mr-2">{dataBag.channel}</span>
          )}
          {dataBag.altitude && (
            <span className="text-zinc-400 capitalize">/ {dataBag.altitude}</span>
          )}
        </div>
      </div>
    )
  }

  // If auto-resolved (pre-filled from daily check-in), show read-only summary
  if (isAutoResolved && dataBag.emotionalVector) {
    return (
      <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-emerald-400">Pre-filled from check-in</span>
        </div>
        <div className="text-sm text-zinc-200">
          {dataBag.channel && (
            <span className="mr-2">{dataBag.channel}</span>
          )}
          {dataBag.altitude && (
            <span className="text-zinc-400 capitalize">/ {dataBag.altitude}</span>
          )}
        </div>
      </div>
    )
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const typedChannel = channel as typeof channels[number]
    const typedAltitude = altitude as typeof altitudes[number]
    onSelect('emotional_checkin', {
      channel: typedChannel,
      altitude: typedAltitude,
      emotionalVector: {
        channelFrom: typedChannel,
        altitudeFrom: typedAltitude,
        channelTo: typedChannel,
        altitudeTo: typedAltitude === 'dissatisfied' ? 'neutral' : typedAltitude === 'neutral' ? 'satisfied' : 'satisfied',
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-zinc-400 mb-2 block">What are you feeling?</label>
        <div className="flex flex-wrap gap-2">
          {channels.map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={`
                px-3 py-1.5 rounded-lg text-sm transition-colors
                ${channel === ch
                  ? 'bg-white/15 text-zinc-100 border border-white/30'
                  : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600'
                }
              `}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-400 mb-2 block">How intensely?</label>
        <div className="flex gap-2">
          {altitudes.map((alt) => (
            <button
              key={alt}
              onClick={() => setAltitude(alt)}
              className={`
                px-3 py-1.5 rounded-lg text-sm capitalize transition-colors
                ${altitude === alt
                  ? 'bg-white/15 text-zinc-100 border border-white/30'
                  : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600'
                }
              `}
            >
              {alt}
            </button>
          ))}
        </div>
      </div>

      {canSubmit && (
        <button
          onClick={handleSubmit}
          className="self-start px-4 py-2 rounded-lg bg-emerald-800/60 text-emerald-200 border border-emerald-700/50 hover:bg-emerald-700/60 transition-colors text-sm"
        >
          Continue
        </button>
      )}
    </div>
  )
}

// ─── Charge Text Step ───────────────────────────────────────────────────────

function ChargeTextStep({
  currentText,
  onSelect,
  isSealed = false,
}: {
  currentText?: string
  onSelect: (text: string) => void
  isSealed?: boolean
}) {
  const [text, setText] = useState(currentText ?? '')

  // Sealed state — show committed intention with lock indicator
  if (isSealed && currentText) {
    return (
      <div className="flex flex-col gap-3">
        <label className="text-xs text-zinc-500">Your intention (locked)</label>
        <div className="relative p-3 rounded-lg bg-zinc-900/40 border border-zinc-700/30 composer-option--sealed-selected">
          <div className="flex items-start gap-2">
            <span className="composer-lock-badge mt-0.5 flex-shrink-0" aria-label="Locked selection">
              <LockIcon size={10} />
            </span>
            <p className="text-sm text-zinc-400">{currentText}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs text-zinc-400">
        What is your intention for this session?
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a brief intention or question to guide your journey..."
        className="w-full p-3 rounded-lg bg-zinc-900/70 border border-zinc-700/50 text-zinc-200 text-sm placeholder:text-zinc-600 resize-none min-h-[80px] focus:border-zinc-500 focus:outline-none"
        rows={3}
      />
      {text.trim().length > 0 && (
        <button
          onClick={() => onSelect(text.trim())}
          className="self-start px-4 py-2 rounded-lg bg-emerald-800/60 text-emerald-200 border border-emerald-700/50 hover:bg-emerald-700/60 transition-colors text-sm"
        >
          Set intention
        </button>
      )}
    </div>
  )
}

// ─── Confirmation Step ──────────────────────────────────────────────────────

/**
 * Shows a summary of all locked selections and a confirm button.
 * Uses gating result to:
 *  - Resolve the template label from visibleTemplates (instead of showing raw key)
 *  - Check isFullyConstrained for confirm-readiness
 *  - Show visible WAVE moves as context
 */
function ConfirmationStep({
  dataBag,
  gating,
  onConfirm,
}: {
  dataBag: ComposerDataBag
  gating: ComposerGatingResult
  onConfirm: () => void
}) {
  const isReady = gating.isFullyConstrained

  // Resolve template label from gating's visible templates
  const templateLabel = dataBag.narrativeTemplateId
    ? resolveTemplateLabel(dataBag.narrativeTemplateId, gating.visibleTemplates)
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4 space-y-3">
        <SummaryRow
          label="Face"
          value={dataBag.lockedFace ? FACE_META[dataBag.lockedFace].label : undefined}
          color={dataBag.lockedFace ? FACE_META[dataBag.lockedFace].color : undefined}
        />
        <SummaryRow
          label="Emotional state"
          value={dataBag.channel && dataBag.altitude ? `${dataBag.channel} / ${dataBag.altitude}` : undefined}
        />
        <SummaryRow
          label="Template"
          value={templateLabel}
        />
        {/* Show visible WAVE moves as part of the build context */}
        {gating.visibleMoves.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Available paths</span>
            <div className="flex gap-1">
              {gating.visibleMoves.map((m) => (
                <span key={m.move} className="text-xs text-zinc-300">
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        )}
        <SummaryRow
          label="Intention"
          value={dataBag.chargeText ?? undefined}
        />
      </div>

      {/* Gating constraint summary */}
      <div className="text-xs text-zinc-500 text-center">
        {gating.totalVisibleOptions} option{gating.totalVisibleOptions !== 1 ? 's' : ''} remaining across all steps
      </div>

      <button
        onClick={onConfirm}
        disabled={!isReady}
        className={`
          px-6 py-3 rounded-lg font-semibold transition-all text-sm
          ${isReady
            ? 'bg-emerald-700/80 text-emerald-100 border border-emerald-600/50 hover:bg-emerald-600/80'
            : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30 cursor-not-allowed'
          }
        `}
      >
        {isReady ? 'Confirm & Freeze Build' : 'Complete all steps to confirm'}
      </button>
    </div>
  )
}

// ─── Shared Sub-components ──────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string
  value?: string
  color?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      {value ? (
        <span className={`flex items-center gap-1.5 ${color ?? 'text-zinc-200'}`}>
          <span className="composer-lock-badge" aria-hidden="true">
            <LockIcon size={8} />
          </span>
          {value}
        </span>
      ) : (
        <span className="text-zinc-600 italic">Not set</span>
      )}
    </div>
  )
}

function PrefilledBadge({
  stepId,
  sources,
}: {
  stepId: ComposerStepId
  sources: Map<keyof ComposerDataBag, PrefilledSource>
}) {
  // Map step ID to the data key it produces
  const keyMap: Record<string, keyof ComposerDataBag> = {
    emotional_checkin: 'emotionalVector',
    face_selection: 'lockedFace',
    narrative_template: 'narrativeTemplateId',
    charge_text: 'chargeText',
  }

  const dataKey = keyMap[stepId]
  if (!dataKey) return null

  const source = sources.get(dataKey)
  if (!source) return null

  const sourceLabels: Record<PrefilledSource['kind'], string> = {
    daily_checkin: "Today's check-in",
    spoke_draw: 'Spoke draw',
    cta: 'Campaign invite',
    checkpoint: 'Resumed session',
  }

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/50">
      {sourceLabels[source.kind]}
    </span>
  )
}

function ComposerProgress({
  steps,
  currentIndex,
  progressPercent,
  stepSummaries,
  dataBag,
  onStepClick,
}: {
  steps: ResolvedStep[]
  currentIndex: number
  progressPercent: number
  stepSummaries: StepVisibilitySummary[]
  dataBag: ComposerDataBag
  onStepClick: (index: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step dots — gating-aware: auto-resolved & sealed steps get distinct visuals */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const summary = stepSummaries.find((s) => s.stepId === step.id)
          const isAutoResolved = summary?.autoResolved ?? false
          const isCompleted = i < currentIndex && isStepCompleted(step.id, dataBag)
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(i)}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${i === currentIndex
                  ? 'bg-emerald-400 scale-125'
                  : isAutoResolved
                    ? 'bg-emerald-600/60'
                    : isCompleted
                      ? 'bg-zinc-500 ring-1 ring-zinc-600/50'
                      : i < currentIndex
                        ? 'bg-emerald-700'
                        : 'bg-zinc-700'
                }
              `}
              aria-label={`Go to step: ${step.label}${isAutoResolved ? ' (auto-resolved)' : isCompleted ? ' (locked)' : ''}`}
              title={`${step.label}${isAutoResolved ? ' (auto-resolved)' : isCompleted ? ' (locked)' : ''}`}
            />
          )
        })}
      </div>
    </div>
  )
}

function StepNavigation({
  currentIndex,
  totalSteps,
  onPrev,
  onNext,
  isLastStep,
}: {
  currentIndex: number
  totalSteps: number
  onPrev: () => void
  onNext: () => void
  isLastStep: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className={`
          text-xs px-3 py-1.5 rounded transition-colors
          ${currentIndex === 0
            ? 'text-zinc-600 cursor-not-allowed'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }
        `}
      >
        Back
      </button>
      <span className="text-xs text-zinc-500">
        {currentIndex + 1} / {totalSteps}
      </span>
      {!isLastStep && (
        <button
          onClick={onNext}
          className="text-xs px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        >
          Skip
        </button>
      )}
    </div>
  )
}

// ─── Lock Icon ──────────────────────────────────────────────────────────────

/**
 * Inline SVG lock icon for sealed/committed selections.
 * Uses currentColor so it inherits from the parent's color token.
 * Silver-slate (#8e9aab) when inside .composer-lock-badge.
 */
function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2M3 7h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Step Completion Check ──────────────────────────────────────────────────

/**
 * Determines whether a step's output data has already been committed to the
 * data bag. When true, the step should be rendered in sealed/locked state
 * with `.composer-option--sealed` CSS classes from cultivation-cards.css.
 *
 * This check is independent of step ordering — it only looks at whether
 * the data the step produces is already present in the bag.
 */
function isStepCompleted(stepId: ComposerStepId, dataBag: ComposerDataBag): boolean {
  switch (stepId) {
    case 'emotional_checkin':
      return dataBag.emotionalVector != null
    case 'face_selection':
      return dataBag.lockedFace != null
    case 'narrative_template':
      return dataBag.narrativeTemplateId != null
    case 'charge_text':
      return dataBag.chargeText != null && dataBag.chargeText.trim() !== ''
    case 'confirmation':
      // Confirmation is never "sealed" — it's the final step
      return false
    default:
      return false
  }
}

// ─── Utility ────────────────────────────────────────────────────────────────

/**
 * Convert an auto-resolved value into the data bag partial for that step.
 */
function autoResolveToData(
  stepId: ComposerStepId,
  value: GameMasterFace | string | PersonalMoveType,
): Partial<ComposerDataBag> | null {
  switch (stepId) {
    case 'face_selection':
      return { lockedFace: value as GameMasterFace }
    case 'narrative_template':
      return { narrativeTemplateId: value as string }
    default:
      return null
  }
}

/**
 * Resolve a template key to its human-readable label using the gating-filtered
 * visible templates. Falls back to the raw key if not found (defensive).
 */
function resolveTemplateLabel(
  templateKey: string,
  visibleTemplates: NarrativeTemplateOption[],
): string {
  const match = visibleTemplates.find((t) => t.templateKey === templateKey)
  return match?.label ?? templateKey
}

// ─── Barrel Export ──────────────────────────────────────────────────────────

export type { ComposerGatingResult }
