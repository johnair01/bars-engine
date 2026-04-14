'use client'

/**
 * useComposerGating — React hook for CYOA Composer branch-visibility filtering.
 *
 * Accepts the player's locked face and emotional vector state, calls the
 * branch-visibility filtering engine, and returns the filtered/visible
 * branches for the current composer step.
 *
 * This hook is the primary React integration point for the pure-function
 * filtering engine in `branch-visibility.ts`. It wraps `computeFilteredOptions`
 * with `useMemo` so that the expensive filtering only re-runs when inputs change.
 *
 * Design:
 *   - Pure consumer of pre-resolved server data (follows useCampaignSkin pattern)
 *   - No fetching — server components pass templateCatalog + campaignConfig as props
 *   - Memoized: only recomputes when locked face, emotional vector, or catalog changes
 *   - Exposes convenience getters: visibleFaces, visibleTemplates, autoResolvedSteps
 *   - Face affinity sorting applied when emotional vector is present
 *
 * Usage:
 *   const gating = useComposerGating({
 *     lockedFace: dataBag.lockedFace,
 *     emotionalVector: dataBag.emotionalVector,
 *     dataBag,
 *     templateCatalog,
 *     campaignConfig,
 *   })
 *
 *   // Render only visible face options
 *   gating.visibleFaces.map(face => <FaceCard key={face.face} {...face} />)
 *
 *   // Check if a step is auto-resolved (skip in wizard)
 *   if (gating.isStepAutoResolved('face_selection')) { ... }
 *
 * @see src/lib/cyoa-composer/branch-visibility.ts — pure filtering engine
 * @see src/lib/cyoa-composer/types.ts — ComposerDataBag, ComposerStepId
 */

import { useMemo } from 'react'
import type { GameMasterFace, EmotionalVector, PersonalMoveType } from '@/lib/quest-grammar/types'
import type { ComposerDataBag, ComposerStepId } from '@/lib/cyoa-composer/types'
import {
  computeFilteredOptions,
  getAutoResolvedValue,
  getVisibleFaces,
  getVisibleTemplates,
  getVisibleMoves,
  sortFacesByAffinity,
  type FilteredOptionSet,
  type FaceOption,
  type NarrativeTemplateOption,
  type WaveMoveOption,
  type TemplateCatalogEntry,
  type CampaignBranchConfig,
  type StepVisibilitySummary,
} from '@/lib/cyoa-composer/branch-visibility'

// ─── Hook Input ──────────────────────────────────────────────────────────────

export interface UseComposerGatingInput {
  /** The player's currently locked face (null if not yet selected) */
  lockedFace: GameMasterFace | null | undefined
  /** The player's resolved emotional vector (null if not yet completed) */
  emotionalVector: EmotionalVector | null | undefined
  /** Full composer data bag (accumulated state from all completed steps) */
  dataBag: ComposerDataBag
  /** Available narrative templates from the registry (passed from server) */
  templateCatalog: TemplateCatalogEntry[]
  /** Optional GM-configured branch restrictions for this campaign */
  campaignConfig?: CampaignBranchConfig
}

// ─── Hook Return ─────────────────────────────────────────────────────────────

export interface ComposerGatingResult {
  /** Complete filtered option set (all steps, all options with visibility) */
  filteredOptions: FilteredOptionSet

  /** Visible face options only (convenience subset) */
  visibleFaces: FaceOption[]
  /** Visible face options sorted by emotional affinity (if vector present) */
  affinitySortedFaces: FaceOption[]
  /** Visible narrative template options only */
  visibleTemplates: NarrativeTemplateOption[]
  /** Visible WAVE move options only */
  visibleMoves: WaveMoveOption[]

  /** Per-step visibility summaries */
  stepSummaries: StepVisibilitySummary[]

  /**
   * Check whether a specific step is auto-resolved (exactly 1 visible option).
   * When true, the composer can skip user interaction and auto-lock the value.
   */
  isStepAutoResolved: (stepId: ComposerStepId) => boolean

  /**
   * Get the auto-resolved value for a step (the single remaining option).
   * Returns null if the step requires manual selection.
   */
  getAutoResolvedValue: (stepId: ComposerStepId) => GameMasterFace | string | PersonalMoveType | null

  /**
   * Total number of visible options across all steps (for progress display).
   * Lower numbers indicate the composer is more constrained / closer to done.
   */
  totalVisibleOptions: number

  /**
   * Whether all required selections are locked (composer ready for confirmation).
   */
  isFullyConstrained: boolean
}

// ─── Hook Implementation ─────────────────────────────────────────────────────

/**
 * React hook that accepts locked face and emotional vector state,
 * calls the branch-visibility filtering engine, and returns the
 * filtered/visible branches for the current composer step.
 *
 * Memoized — only recomputes when any input value changes.
 */
export function useComposerGating(input: UseComposerGatingInput): ComposerGatingResult {
  const {
    lockedFace,
    emotionalVector,
    dataBag,
    templateCatalog,
    campaignConfig,
  } = input

  // ── Core memo: run the filtering engine ──────────────────────────────────
  // Dependencies are the primitive/stable values that drive the filter.
  // dataBag is the canonical source, but we list lockedFace and emotionalVector
  // separately so React can shallow-compare the top-level values that change
  // most often during the composer flow.

  const filteredOptions = useMemo(
    () => computeFilteredOptions(dataBag, templateCatalog, campaignConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dataBag is the canonical source;
    // lockedFace and emotionalVector are listed for granular reactivity
    [
      dataBag,
      templateCatalog,
      campaignConfig,
      lockedFace,
      emotionalVector,
    ],
  )

  // ── Derived convenience values (memoized separately for stability) ───────

  const visibleFaces = useMemo(
    () => getVisibleFaces(filteredOptions.faces),
    [filteredOptions.faces],
  )

  const affinitySortedFaces = useMemo(
    () => sortFacesByAffinity(visibleFaces, emotionalVector ?? null),
    [visibleFaces, emotionalVector],
  )

  const visibleTemplates = useMemo(
    () => getVisibleTemplates(filteredOptions.narrativeTemplates),
    [filteredOptions.narrativeTemplates],
  )

  const visibleMoves = useMemo(
    () => getVisibleMoves(filteredOptions.waveMoves),
    [filteredOptions.waveMoves],
  )

  const stepSummaries = filteredOptions.summary

  // ── Auto-resolution helpers ──────────────────────────────────────────────

  const isStepAutoResolved = useMemo(
    () => (stepId: ComposerStepId): boolean => {
      const summary = stepSummaries.find((s) => s.stepId === stepId)
      return summary?.autoResolved ?? false
    },
    [stepSummaries],
  )

  const getAutoResolved = useMemo(
    () => (stepId: ComposerStepId): GameMasterFace | string | PersonalMoveType | null => {
      return getAutoResolvedValue(filteredOptions, stepId)
    },
    [filteredOptions],
  )

  // ── Aggregate metrics ────────────────────────────────────────────────────

  const totalVisibleOptions = useMemo(
    () => stepSummaries.reduce((sum, s) => sum + s.visibleOptions, 0),
    [stepSummaries],
  )

  const isFullyConstrained = useMemo(
    () => {
      // Fully constrained when face and template are both locked
      // (charge_text and confirmation are free-form / always available)
      return (
        dataBag.lockedFace != null &&
        dataBag.narrativeTemplateId != null &&
        dataBag.emotionalVector != null
      )
    },
    [dataBag.lockedFace, dataBag.narrativeTemplateId, dataBag.emotionalVector],
  )

  return {
    filteredOptions,
    visibleFaces,
    affinitySortedFaces,
    visibleTemplates,
    visibleMoves,
    stepSummaries,
    isStepAutoResolved,
    getAutoResolvedValue: getAutoResolved,
    totalVisibleOptions,
    isFullyConstrained,
  }
}
