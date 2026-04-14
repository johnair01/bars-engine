'use client'

/**
 * ComposerContainer — Main container for the CYOA Composer wizard.
 *
 * Wires the adaptive resolver into the Composer page by:
 *   1. Accepting pre-fetched player context + build history from the server
 *   2. Calling resolveAdaptiveSteps to compute the initial step sequence
 *   3. Passing face recommendations (from completedBuilds) to FaceRecommendations
 *   4. Managing build selection state (ComposerDataBag) with selection handlers
 *      that feed back via advanceAndResolve
 *   5. Auto-saving checkpoints on every step completion
 *
 * State flow:
 *   Server (getPlayerComposerContext) → ComposerContainer → resolveAdaptiveSteps
 *     → ComposerStepRenderer (step UI) + FaceRecommendations (face cards)
 *     → selection handler → advanceAndResolve → re-render with new resolution
 *     → checkpoint save (async, non-blocking)
 *
 * The container is the single source of truth for:
 *   - Current AdaptiveResolution (step ordering + data bag)
 *   - Build selection state (face, emotional vector, template, charge text)
 *   - Checkpoint persistence triggers
 *
 * @see src/lib/cyoa-composer/adaptive-resolver.ts — pure resolver
 * @see src/components/composer/FaceRecommendations.tsx — face recommendation cards
 * @see src/components/cyoa/composer/ComposerStepRenderer.tsx — step renderer
 * @see src/actions/cyoa-build-checkpoint.ts — checkpoint auto-save
 * @see src/lib/cyoa/build-contract.ts — CyoaBuildState, finalizeReceipt
 */

import { useState, useCallback, useMemo, useTransition } from 'react'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { FACE_META } from '@/lib/quest-grammar/types'
import type { ComposerDataBag, ComposerStepId } from '@/lib/cyoa-composer/types'
import type { TemplateCatalogEntry, CampaignBranchConfig } from '@/lib/cyoa-composer/branch-visibility'
import type {
  PlayerComposerContext,
  AdaptiveResolution,
  PrefilledSource,
} from '@/lib/cyoa-composer/adaptive-resolver'
import {
  resolveAdaptiveSteps,
  advanceAndResolve,
} from '@/lib/cyoa-composer/adaptive-resolver'
import type { CompletedBuildReceipt } from '@/lib/campaign-hub/types'
import { FaceRecommendations } from '@/components/composer/FaceRecommendations'
import { ComposerStepRenderer } from '@/components/cyoa/composer'
import { checkpointOnNodeTransition } from '@/actions/cyoa-build-checkpoint'
import {
  createBuildState,
  lockChoice,
  type CyoaBuildState,
} from '@/lib/cyoa/build-contract'

// ─── Props ──────────────────────────────────────────────────────────────────

export interface ComposerContainerProps {
  /** Player context assembled by the server action. */
  playerContext: PlayerComposerContext
  /** Completed build receipts from hub ledger (self-contained, no fan-out). */
  completedBuilds: CompletedBuildReceipt[]
  /** Available narrative templates from the server-loaded registry. */
  templateCatalog: TemplateCatalogEntry[]
  /** Optional GM-configured branch restrictions. */
  campaignConfig?: CampaignBranchConfig
  /** Adventure ID for checkpoint persistence. */
  adventureId: string
  /** Campaign reference for build receipt construction. */
  campaignRef: string
  /** Current spoke index (0-7). */
  spokeIndex: number
  /** Callback when the build is finalized (receipt produced). */
  onBuildFinalized?: (receipt: ComposerDataBag) => void
}

// ─── Container Component ───────────────────────────────────────────────────

/**
 * ComposerContainer — the adaptive composer's main client-side container.
 *
 * On mount:
 *   1. Runs resolveAdaptiveSteps with the server-fetched playerContext
 *   2. Computes face recommendations from completedBuilds
 *   3. Renders the step wizard via ComposerStepRenderer
 *   4. Shows FaceRecommendations when the face_selection step is active
 *
 * On step completion:
 *   1. Calls advanceAndResolve to merge new data + re-evaluate steps
 *   2. Updates the build state (CyoaBuildState) with locked/draft choices
 *   3. Fires async checkpoint save (non-blocking)
 *   4. Re-renders with the updated resolution
 */
export function ComposerContainer({
  playerContext,
  completedBuilds,
  templateCatalog,
  campaignConfig,
  adventureId,
  campaignRef,
  spokeIndex,
  onBuildFinalized,
}: ComposerContainerProps) {
  // ── Initial resolution (runs once with server-fetched context) ─────────
  const initialResolution = useMemo(
    () => resolveAdaptiveSteps(playerContext),
    [playerContext],
  )

  // ── State: current adaptive resolution ─────────────────────────────────
  const [resolution, setResolution] = useState<AdaptiveResolution>(initialResolution)

  // ── State: build state for checkpoint persistence ──────────────────────
  const [buildState, setBuildState] = useState<CyoaBuildState>(() =>
    createBuildState({
      buildId: generateBuildId(),
      campaignRef,
      spokeIndex,
    }),
  )

  // ── Transition for async checkpoint saves ──────────────────────────────
  const [isSaving, startSaveTransition] = useTransition()

  // ── Step completion handler ────────────────────────────────────────────
  // When a step completes:
  //   1. Merge new data into the bag via advanceAndResolve
  //   2. Update the build state with locked/draft choices
  //   3. Fire async checkpoint
  const handleStepComplete = useCallback(
    (stepId: ComposerStepId, data: Partial<ComposerDataBag>) => {
      // Re-resolve with new data
      const newResolution = advanceAndResolve(
        resolution.resolvedBag,
        data,
        playerContext,
      )
      setResolution(newResolution)

      // Update build state with new selections
      setBuildState((prev) => {
        const updated = { ...prev, updatedAt: new Date().toISOString() }

        // Lock face when face_selection step completes
        if (stepId === 'face_selection' && data.lockedFace) {
          updated.face = lockChoice(data.lockedFace)
        }

        // Lock emotional vector when emotional_checkin step completes
        if (stepId === 'emotional_checkin' && data.emotionalVector) {
          updated.emotionalVector = lockChoice(data.emotionalVector)
        }

        // Draft narrative template selection (mutable until finalization)
        if (stepId === 'narrative_template' && data.narrativeTemplateId) {
          updated.narrativeTemplate = {
            templateId: data.narrativeTemplateId,
            templateKind: resolveTemplateKind(data.narrativeTemplateId, templateCatalog),
          }
        }

        // Store charge text in extras
        if (stepId === 'charge_text' && data.chargeText) {
          updated.extras = { ...updated.extras, chargeText: data.chargeText }
        }

        // Store daily check-in ID in extras if available
        if (data.dailyCheckInId) {
          updated.extras = { ...updated.extras, dailyCheckInId: data.dailyCheckInId }
        }

        return updated
      })

      // Fire async checkpoint save (non-blocking)
      startSaveTransition(async () => {
        // Build the checkpoint build state with the latest data
        const currentBuildState: CyoaBuildState = {
          ...buildState,
          updatedAt: new Date().toISOString(),
          // Update with whatever was just changed
          ...(stepId === 'face_selection' && data.lockedFace
            ? { face: lockChoice(data.lockedFace) }
            : {}),
          ...(stepId === 'emotional_checkin' && data.emotionalVector
            ? { emotionalVector: lockChoice(data.emotionalVector) }
            : {}),
        }

        // Determine the "current node" for checkpoint — use step ID as node marker
        const nodeId = `composer_step_${stepId}`
        await checkpointOnNodeTransition(adventureId, nodeId, currentBuildState)
      })
    },
    [resolution, playerContext, buildState, adventureId, templateCatalog],
  )

  // ── Face selection handler (bridges FaceRecommendations → step state) ──
  const handleFaceSelect = useCallback(
    (face: GameMasterFace) => {
      handleStepComplete('face_selection', { lockedFace: face })
    },
    [handleStepComplete],
  )

  // ── Build confirmation handler ─────────────────────────────────────────
  const handleConfirm = useCallback(
    (finalBag: ComposerDataBag) => {
      // Mark build as finalized
      setBuildState((prev) => ({
        ...prev,
        status: 'finalized' as const,
        updatedAt: new Date().toISOString(),
      }))

      // Notify parent
      onBuildFinalized?.(finalBag)
    },
    [onBuildFinalized],
  )

  // ── Determine if we're on the face_selection step ──────────────────────
  const currentActiveStep = resolution.activeSteps[0] ?? null
  const isFaceSelectionActive = currentActiveStep?.id === 'face_selection'

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">
          Build Composer
        </h1>
        {isSaving && (
          <span className="text-xs text-zinc-500 animate-pulse">
            Saving…
          </span>
        )}
      </div>

      {/* Face Recommendations — shown prominently during face_selection step,
          or as a compact summary when face is already locked */}
      {isFaceSelectionActive && (
        <section aria-label="Face recommendations">
          <FaceRecommendations
            completedBuilds={completedBuilds}
            emotionalVector={resolution.resolvedBag.emotionalVector}
            selectedFace={resolution.resolvedBag.lockedFace ?? null}
            onSelectFace={handleFaceSelect}
          />
        </section>
      )}

      {/* Locked face summary — shown after face is locked and we've moved past */}
      {!isFaceSelectionActive && resolution.resolvedBag.lockedFace && (
        <LockedFaceSummary
          face={resolution.resolvedBag.lockedFace}
          completedBuilds={completedBuilds}
        />
      )}

      {/* Step Renderer — the universal adaptive wizard */}
      <ComposerStepRenderer
        resolution={resolution}
        templateCatalog={templateCatalog}
        campaignConfig={campaignConfig}
        onStepComplete={handleStepComplete}
        onConfirm={handleConfirm}
      />

      {/* Pre-fill provenance badges */}
      {resolution.prefilledSources.size > 0 && (
        <PrefilledProvenance sources={resolution.prefilledSources} />
      )}
    </div>
  )
}

// ─── Locked Face Summary ──────────────────────────────────────────────────

/**
 * Compact display of the locked face after the player has advanced past
 * the face_selection step. Shows the face label + how many times it's been
 * used (from completedBuilds history).
 */
function LockedFaceSummary({
  face,
  completedBuilds,
}: {
  face: GameMasterFace
  completedBuilds: CompletedBuildReceipt[]
}) {
  const faceMeta = useMemo(
    () => FACE_META[face],
    [face],
  )

  const usageCount = useMemo(
    () => completedBuilds.filter((b) => b.face === face).length,
    [completedBuilds, face],
  )

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900/60 border border-zinc-700/40">
      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-semibold ${faceMeta.color}`}>
          {faceMeta.label}
        </span>
        <span className="text-xs text-zinc-500 ml-2">
          {faceMeta.role}
        </span>
      </div>
      <span className="text-xs text-zinc-500">
        {usageCount} prior {usageCount === 1 ? 'build' : 'builds'}
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-600/40">
        Locked
      </span>
    </div>
  )
}

// ─── Pre-filled Provenance ────────────────────────────────────────────────

/**
 * Shows provenance badges for pre-filled data values.
 * Helps the player understand why certain steps were auto-skipped.
 */
function PrefilledProvenance({
  sources,
}: {
  sources: Map<keyof ComposerDataBag, PrefilledSource>
}) {
  const entries = Array.from(sources.entries())
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {entries.map(([key, source]) => (
        <span
          key={key}
          className="text-xs px-2 py-1 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/30"
        >
          {formatDataKey(key)}: {formatSource(source)}
        </span>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Generate a unique build ID (simple cuid-style for client-side). */
function generateBuildId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `bld_${timestamp}_${random}`
}

/** Resolve template kind from the catalog by template ID. */
function resolveTemplateKind(
  templateId: string,
  catalog: TemplateCatalogEntry[],
): string {
  const entry = catalog.find((t) => t.templateKey === templateId)
  return entry?.templateKind ?? 'quest'
}

/** Human-readable label for a data bag key. */
function formatDataKey(key: keyof ComposerDataBag): string {
  const labels: Record<string, string> = {
    emotionalVector: 'Emotional vector',
    channel: 'Channel',
    altitude: 'Altitude',
    lockedFace: 'Face',
    narrativeTemplateId: 'Template',
    chargeText: 'Charge',
    dailyCheckInId: 'Check-in',
  }
  return labels[key] ?? key
}

/** Human-readable label for a pre-fill source. */
function formatSource(source: PrefilledSource): string {
  switch (source.kind) {
    case 'daily_checkin':
      return "from today's check-in"
    case 'spoke_draw':
      return 'from spoke draw'
    case 'cta':
      return 'from invitation'
    case 'checkpoint':
      return 'from saved session'
  }
}
