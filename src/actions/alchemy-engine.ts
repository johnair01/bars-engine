'use server'

/**
 * Alchemy Engine — Server Actions
 *
 * Phase-locked CYOA arc: Intake → Action → Reflection
 * Vertical slice: Challenger face + Wake Up WAVE move
 *
 * Each phase completion:
 *   1. Validates phase-locked prerequisites
 *   2. Creates a channel-typed BAR for that phase
 *   3. Advances regulation via completePhase()
 *
 * Key invariant: Reflection BAR IS the epiphany (no separate Epiphany model).
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { getEngineState, completePhase, initializeArc } from '@/lib/alchemy-engine/player-state'
import {
  type ArcPhase,
  type RegulationState,
  type PhaseAdvanceResult,
  type ChallengerMoveId,
  VERTICAL_SLICE,
  isChallengerMoveId,
} from '@/lib/alchemy-engine/types'
import {
  validateIntakePhaseCompletion,
  validateActionPhaseCompletion,
  validateReflectionPhaseCompletion,
  advancePhaseInTransaction,
  PhaseAdvancementError,
} from '@/lib/alchemy-engine/phase-advancement'
import {
  buildActionBarData,
  buildIntakeBarData,
  buildReflectionBarData,
  persistBarInTransaction,
} from '@/lib/alchemy-engine/bar-production'
import {
  resolveStabilizedChannel,
} from '@/lib/alchemy-engine/channel-resolution'
import {
  aggregateReflectionContext,
} from '@/lib/alchemy-engine/reflection-aggregator'
import {
  buildStaticCompletionSuggestions,
  generateReflectionCompletions,
} from '@/lib/alchemy-engine/reflection-generation'
import type { ReflectionCompletionSet } from '@/lib/alchemy-engine/reflection-generation'
import {
  validateCompletionSetWithBarConformance,
  explainValidation,
} from '@/lib/alchemy-engine/reflection-validation'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface IntakeCompletionResult {
  success: boolean
  /** The created BAR id. */
  barId?: string
  /** Phase advance result (regulation change + next phase). */
  advance?: PhaseAdvanceResult
  /** Error message if completion failed. */
  error?: string
}

export interface ActionCompletionResult {
  success: boolean
  /** The created Action BAR id. */
  barId?: string
  /** Phase advance result (regulation change + next phase). */
  advance?: PhaseAdvanceResult
  /** The Challenger move that was selected. */
  moveId?: ChallengerMoveId
  /** Error message if completion failed. */
  error?: string
}

export interface ReflectionCompletionResult {
  success: boolean
  /** The created Reflection BAR id — this IS the epiphany artifact. */
  barId?: string
  /** Phase advance result (regulation → satisfied, arc complete). */
  advance?: PhaseAdvanceResult
  /** The emotional channel the BAR is typed to (the stabilized channel). */
  channel?: EmotionalChannel
  /** Error message if completion failed. */
  error?: string
}

export interface StartArcResult {
  success: boolean
  arcPhase?: ArcPhase
  regulation?: RegulationState
  error?: string
}

// ---------------------------------------------------------------------------
// startAlchemyArc — Initialize a new arc (Challenger + Wake Up)
// ---------------------------------------------------------------------------

/**
 * Start a new Alchemy Engine arc for the authenticated player.
 *
 * Sets arcPhase = 'intake', regulation = 'dissatisfied',
 * face = 'challenger', waveMove = 'wakeUp'.
 *
 * If the player already has an active arc, returns an error.
 */
export async function startAlchemyArc(
  channel: EmotionalChannel,
): Promise<StartArcResult> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  // Check if an arc is already in progress
  const existing = await getEngineState(player.id)
  if (existing?.arcPhase !== null && existing?.arcPhase !== undefined) {
    return {
      success: false,
      error: `Arc already in progress (phase: ${existing.arcPhase}). Complete or reset it first.`,
    }
  }

  const state = await initializeArc(player.id, channel, {
    face: VERTICAL_SLICE.face,
    waveMove: VERTICAL_SLICE.waveMove,
  })

  return {
    success: true,
    arcPhase: state.arcPhase ?? 'intake',
    regulation: state.regulation,
  }
}

// ---------------------------------------------------------------------------
// completeIntakePhase — Intake completion → BAR + regulation advance
// ---------------------------------------------------------------------------

/**
 * Complete the Intake phase of the Alchemy Engine arc.
 *
 * Phase-locked: player must be in 'intake' phase with 'dissatisfied' regulation.
 *
 * On success:
 *   1. Creates an Intake BAR (CustomBar) typed to:
 *      - The player's emotional channel
 *      - Wake Up (WAVE move)
 *      - Challenger (GM face)
 *      - Phase: 'intake'
 *   2. Advances regulation from 'dissatisfied' → 'neutral'
 *   3. Moves arcPhase from 'intake' → 'action'
 *
 * @param intakeContent - Player's intake content (CYOA selection summary or freeform text)
 * @param intakeTitle   - Optional title for the BAR (defaults to generated title)
 */
export async function completeIntakePhase(
  intakeContent: string,
  intakeTitle?: string,
): Promise<IntakeCompletionResult> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  // ── Step 1: Validate phase-locked state ───────────────────────────────────
  const state = await getEngineState(player.id)
  if (!state) {
    return { success: false, error: 'No alchemy engine state found. Start an arc first.' }
  }

  const validation = validateIntakePhaseCompletion(state.arcPhase, state.regulation)
  if (!validation.valid) {
    return { success: false, error: validation.reason ?? 'Intake phase validation failed.' }
  }

  // ── Step 2: Create intake BAR + advance phase in a transaction ────────────
  // Build channel-typed BAR data using the dedicated bar-production module.
  const barData = buildIntakeBarData({
    playerId: player.id,
    channel: state.channel,
    content: intakeContent,
    title: intakeTitle,
    waveMove: state.waveMove ?? undefined,
    face: state.face ?? undefined,
  })

  try {
    const { barId, advance } = await db.$transaction(async (tx) => {
      // 2a. Persist the channel-typed Intake BAR
      const createdBarId = await persistBarInTransaction(tx, barData)

      // 2b. Advance phase using shared phase-advancement logic
      // Re-validates within transaction to prevent race conditions
      const transition = await advancePhaseInTransaction(tx, player.id, 'intake')

      const advanceResult: PhaseAdvanceResult = {
        success: true,
        newPhase: transition.toPhase,
        newRegulation: transition.toRegulation,
        arcComplete: transition.arcComplete,
      }

      return { barId: createdBarId, advance: advanceResult }
    })

    return {
      success: true,
      barId,
      advance,
    }
  } catch (err) {
    if (err instanceof PhaseAdvancementError) {
      return { success: false, error: err.message }
    }
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Intake completion failed: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// completeActionPhase — Action completion → BAR + phase advance
// ---------------------------------------------------------------------------

/**
 * Complete the Action phase of the Alchemy Engine arc.
 *
 * Phase-locked: player must be in 'action' phase with 'neutral' regulation.
 *
 * Receives the selected Challenger move choice and validates it against:
 *   1. Authentication — player must be logged in
 *   2. Phase lock — arcPhase must be 'action'
 *   3. Regulation lock — regulation must be 'neutral'
 *   4. Move validity — moveId must be a valid Challenger move ID
 *   5. Response content — non-empty text required (behavior over self-report)
 *
 * On success:
 *   1. Creates an Action BAR (CustomBar) typed to:
 *      - The player's emotional channel
 *      - Wake Up (WAVE move)
 *      - Challenger (GM face)
 *      - Phase: 'action'
 *      - Challenger move metadata (canonicalMoveId, energyDelta)
 *   2. Regulation stays at 'neutral' (action builds capacity, doesn't advance regulation)
 *   3. Moves arcPhase from 'action' → 'reflection'
 *
 * Non-AI first-class: operates entirely on CYOA selection + freeform text.
 *
 * @param moveId - The selected Challenger move ('issue_challenge' | 'propose_move')
 * @param response - Player's response text (their commitment / declaration)
 * @param responseTitle - Optional title override for the BAR
 */
export async function completeActionPhase(
  moveId: string,
  response: string,
  responseTitle?: string,
): Promise<ActionCompletionResult> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  // ── Step 1: Validate the move choice ──────────────────────────────────────
  if (!isChallengerMoveId(moveId)) {
    return {
      success: false,
      error: `Invalid Challenger move: '${moveId}'. Valid moves: issue_challenge, propose_move.`,
    }
  }

  // ── Step 2: Validate response content ─────────────────────────────────────
  const trimmedResponse = response?.trim() ?? ''
  if (trimmedResponse.length === 0) {
    return {
      success: false,
      error: 'Action response cannot be empty. The Challenger requires a commitment.',
    }
  }

  // ── Step 3: Validate phase-locked state ───────────────────────────────────
  const state = await getEngineState(player.id)
  if (!state) {
    return { success: false, error: 'No alchemy engine state found. Start an arc first.' }
  }

  const validation = validateActionPhaseCompletion(state.arcPhase, state.regulation)
  if (!validation.valid) {
    return { success: false, error: validation.reason ?? 'Action phase validation failed.' }
  }

  // ── Step 4: Create Action BAR + advance phase in a transaction ────────────
  // Build channel-typed BAR data using the dedicated bar-production module.
  // This encapsulates all channel typing logic: emotional channel → nation tag,
  // Challenger move metadata → strandMetadata provenance.
  const barData = buildActionBarData({
    playerId: player.id,
    channel: state.channel,
    moveId,
    response: trimmedResponse,
    responseTitle,
    waveMove: state.waveMove ?? undefined,
    face: state.face ?? undefined,
  })

  try {
    const { barId, advance } = await db.$transaction(async (tx) => {
      // 4a. Persist the channel-typed Action BAR
      const createdBarId = await persistBarInTransaction(tx, barData)

      // 4b. Advance phase using shared phase-advancement logic
      // Re-validates within transaction to prevent race conditions
      // Action phase: regulation stays 'neutral' (capacity building per PHASE_REGULATION_MAP)
      const transition = await advancePhaseInTransaction(tx, player.id, 'action')

      const advanceResult: PhaseAdvanceResult = {
        success: true,
        newPhase: transition.toPhase,
        newRegulation: transition.toRegulation,
        arcComplete: transition.arcComplete,
      }

      return { barId: createdBarId, advance: advanceResult }
    })

    return {
      success: true,
      barId,
      advance,
      moveId,
    }
  } catch (err) {
    if (err instanceof PhaseAdvancementError) {
      return { success: false, error: err.message }
    }
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Action completion failed: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// completeReflectionPhase — Reflection completion → channel-typed epiphany BAR
// ---------------------------------------------------------------------------

/**
 * Complete the Reflection phase of the Alchemy Engine arc.
 *
 * Phase-locked: player must be in 'reflection' phase with 'neutral' regulation.
 *
 * KEY INVARIANT: The Reflection BAR IS the epiphany artifact. No separate Epiphany model.
 *
 * Channel typing logic:
 *   The Reflection BAR is typed to the emotional channel the player STABILIZED through.
 *   This is resolved by `resolveStabilizedChannel()`, which reads the player's arc state
 *   and prior BARs to determine the channel that was carried through all 3 phases.
 *   The stabilized channel becomes:
 *     - `nation` field on the BAR (lowercase: 'fear', 'anger', etc.)
 *     - `emotionalAlchemyTag` field (same as nation, for query alignment)
 *     - `channel` field in strandMetadata JSON (title-case: 'Fear', 'Anger', etc.)
 *
 * On success:
 *   1. Resolves the stabilized channel from the player's arc
 *   2. Creates a Reflection BAR (CustomBar) typed to:
 *      - The player's stabilized emotional channel
 *      - Wake Up (WAVE move)
 *      - Challenger (GM face)
 *      - Phase: 'reflection'
 *      - isEpiphany: true in strandMetadata
 *      - intakeBarId + actionBarId for provenance chain
 *   3. Advances regulation from 'neutral' → 'satisfied' (= epiphany state)
 *   4. Marks arc as complete (arcCompletedAt is set)
 *
 * Non-AI first-class: operates on CYOA selection or freeform text.
 *
 * @param reflectionContent - Player's reflection/epiphany text
 * @param reflectionTitle   - Optional title override for the BAR
 * @param reflectionSource  - Optional provenance: how the content was created (CYOA/freeform, edited, etc.)
 */
export async function completeReflectionPhase(
  reflectionContent: string,
  reflectionTitle?: string,
  reflectionSource?: {
    mode: 'cyoa' | 'freeform'
    selectedCompletionId?: string
    isCustomized?: boolean
  },
): Promise<ReflectionCompletionResult> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  // ── Step 1: Validate phase-locked state ───────────────────────────────────
  const state = await getEngineState(player.id)
  if (!state) {
    return { success: false, error: 'No alchemy engine state found. Start an arc first.' }
  }

  const validation = validateReflectionPhaseCompletion(state.arcPhase, state.regulation)
  if (!validation.valid) {
    return { success: false, error: validation.reason ?? 'Reflection phase validation failed.' }
  }

  // ── Step 2: Validate content ──────────────────────────────────────────────
  const trimmedContent = reflectionContent?.trim() ?? ''
  if (trimmedContent.length === 0) {
    return {
      success: false,
      error: 'Reflection content cannot be empty. The epiphany needs substance.',
    }
  }

  // ── Step 3: Resolve stabilized channel ────────────────────────────────────
  // The Reflection BAR is typed to the channel the player worked through.
  // resolveStabilizedChannel reads the arc state + prior BARs to determine
  // the consistent channel. Falls back to current state channel.
  const stabilizedChannel = await resolveStabilizedChannel(player.id)

  // ── Step 4: Find prior BAR IDs for provenance chain ───────────────────────
  const arcStartedAt = state.arcStartedAt ?? new Date(0)
  const priorBars = await db.customBar.findMany({
    where: {
      creatorId: player.id,
      type: { in: ['intake', 'action'] },
      createdAt: { gte: arcStartedAt },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, type: true },
  })

  const intakeBarId = priorBars.find((b) => b.type === 'intake')?.id
  const actionBarId = priorBars.find((b) => b.type === 'action')?.id

  // ── Step 5: Build channel-typed Reflection BAR ────────────────────────────
  const barData = buildReflectionBarData({
    playerId: player.id,
    channel: stabilizedChannel,
    content: trimmedContent,
    title: reflectionTitle,
    waveMove: state.waveMove ?? undefined,
    face: state.face ?? undefined,
    intakeBarId,
    actionBarId,
    reflectionSource,
  })

  // ── Step 6: Persist BAR + advance phase in transaction ────────────────────
  try {
    const { barId, advance } = await db.$transaction(async (tx) => {
      // 6a. Persist the channel-typed Reflection BAR (the epiphany artifact)
      const createdBarId = await persistBarInTransaction(tx, barData)

      // 6b. Advance phase: reflection → arc complete, regulation → satisfied
      const transition = await advancePhaseInTransaction(tx, player.id, 'reflection')

      const advanceResult: PhaseAdvanceResult = {
        success: true,
        newPhase: transition.toPhase,        // null (arc complete)
        newRegulation: transition.toRegulation, // 'satisfied'
        arcComplete: transition.arcComplete,    // true
      }

      return { barId: createdBarId, advance: advanceResult }
    })

    return {
      success: true,
      barId,
      advance,
      channel: stabilizedChannel,
    }
  } catch (err) {
    if (err instanceof PhaseAdvancementError) {
      return { success: false, error: err.message }
    }
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Reflection completion failed: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// generateReflectionOptions — Aggregate + generate + validate reflection choices
// ---------------------------------------------------------------------------

/**
 * Result of generating reflection completion options.
 */
export interface ReflectionOptionsResult {
  success: boolean
  /** The validated set of 3 channel-typed completion suggestions. */
  completions?: ReflectionCompletionSet
  /** Human-readable narrative summary of the arc so far. */
  narrativeSummary?: string
  /** The emotional channel for the arc. */
  channel?: EmotionalChannel
  /** Validation issues (empty if valid). */
  validationIssues?: string[]
  /** Error message if generation failed. */
  error?: string
}

/**
 * Generate reflection completion options for the authenticated player.
 *
 * Orchestrates the full pipeline:
 *   1. Authentication — player must be logged in
 *   2. Phase-lock validation — player must be in 'reflection' phase with 'neutral' regulation
 *   3. Aggregation — collects Intake + Action phase BARs into a ReflectionContext
 *   4. Generation — builds 3 channel-typed CYOA completion suggestions:
 *      - Channel-aligned (direct): same emotional channel as the arc
 *      - Adjacent (generative): from the shēng (nourishing) Wuxing neighbor
 *      - Cross (challenging): from the kè (control) Wuxing neighbor
 *   5. Validation — ensures all suggestions conform to BAR structure + Wuxing cycles
 *
 * Non-AI first-class:
 *   - When `useAI` is false (default), suggestions are built deterministically
 *     from CYOA selections using `buildStaticCompletionSuggestions()`. No AI needed.
 *   - When `useAI` is true, calls `generateReflectionCompletions()` which uses an LLM
 *     via `generateObject`. Falls back to static suggestions if AI is unavailable.
 *
 * The returned suggestions are what the player chooses from in the Reflection phase.
 * The chosen suggestion becomes the Reflection BAR — the epiphany artifact.
 *
 * @param useAI - Whether to use AI-augmented generation (default: false, non-AI first-class)
 * @returns ReflectionOptionsResult with 3 validated completion suggestions
 */
export async function generateReflectionOptions(
  useAI: boolean = false,
): Promise<ReflectionOptionsResult> {
  // ── Step 1: Authenticate ──────────────────────────────────────────────────
  const player = await getCurrentPlayer()
  if (!player) {
    return { success: false, error: 'Not authenticated' }
  }

  // ── Step 2: Validate phase-locked state ───────────────────────────────────
  const state = await getEngineState(player.id)
  if (!state) {
    return { success: false, error: 'No alchemy engine state found. Start an arc first.' }
  }

  const validation = validateReflectionPhaseCompletion(state.arcPhase, state.regulation)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason ?? 'Cannot generate reflection options: phase validation failed.',
    }
  }

  // ── Step 3: Aggregate Intake + Action data into ReflectionContext ──────────
  const aggregation = await aggregateReflectionContext(player.id)
  if (aggregation.error || !aggregation.context) {
    return { success: false, error: aggregation.error ?? 'Failed to aggregate reflection context.' }
  }

  const ctx = aggregation.context

  // ── Step 4: Generate 3 channel-typed completion suggestions ────────────────
  let completions: ReflectionCompletionSet

  if (useAI) {
    // AI path: call LLM via generateObject. Falls back to static on failure.
    completions = await generateReflectionCompletions(ctx)
  } else {
    // Non-AI path (first-class): deterministic suggestions from CYOA selections.
    completions = buildStaticCompletionSuggestions(ctx)
  }

  // ── Step 5: Validate the generated completion set ─────────────────────────
  // Full pipeline validation: structural correctness + BAR conformance + Wuxing cycles.
  // This ensures every suggestion can become a valid Reflection BAR with isEpiphany: true.
  const validationResult = validateCompletionSetWithBarConformance(completions, ctx.channel)

  if (!validationResult.valid) {
    // Log validation issues for debugging, but still return them to the client.
    // In a production system we'd attempt re-generation or sanitization here.
    console.warn(
      '[alchemy-engine] Reflection options validation failed:',
      explainValidation(validationResult),
    )

    return {
      success: false,
      error: 'Generated reflection options failed validation. Please try again.',
      validationIssues: validationResult.issues.map(
        (issue) => `[${issue.code}]${issue.path ? ` at ${issue.path}` : ''}: ${issue.message}`,
      ),
    }
  }

  // ── Step 6: Return formatted completion options ───────────────────────────
  return {
    success: true,
    completions,
    narrativeSummary: ctx.narrativeSummary,
    channel: ctx.channel,
  }
}

// ---------------------------------------------------------------------------
// resolvePhasePassage — Resolve AI or static passage content for a phase
// ---------------------------------------------------------------------------

/**
 * Result of resolving passage content for a phase.
 * This is the client-facing contract — components receive this and render
 * the same UI regardless of content source.
 */
export interface ResolvedPassageResult {
  success: boolean
  /** Scene-setting narrative. */
  situation?: string
  /** Friction point — what's at stake. */
  friction?: string
  /** Invitation — what the player is being asked. */
  invitation?: string
  /** How the content was obtained: 'ai' | 'template_bank' | 'static_inline' | 'cached_ai'. */
  source?: string
  /** Whether AI was available when resolved. */
  aiAvailable?: boolean
  /** Why fallback was used (if any). */
  fallbackReason?: string
  /** AI model used, if any. */
  model?: string | null
  /** Error message if resolution failed. */
  error?: string
}

/**
 * Resolve passage content (situation, friction, invitation) for the current phase.
 *
 * Integrates AI-generated content into the CYOA passage rendering flow:
 *   - When AI is available and not disabled: generates phase-specific content
 *     grounded in the player's emotional channel, prior phase content, and
 *     Challenger + Wake Up WAVE context.
 *   - When AI is unavailable: serves GM-authored template bank content (channel-typed)
 *     or static inline content (always available).
 *
 * The resolved content replaces static header/description text in phase step
 * components. Source attribution is included so the UI can show provenance.
 *
 * Non-AI first-class: when `preferStatic` is true, AI is skipped entirely.
 * This is not a fallback — it's a first-class content path.
 *
 * @param phase - Which phase to resolve content for ('intake' | 'action' | 'reflection')
 * @param preferStatic - When true, serve template bank / static content only (default: false)
 * @returns ResolvedPassageResult with content + source attribution
 */
export async function resolvePhasePassage(
  phase: ArcPhase,
  preferStatic: boolean = false,
): Promise<ResolvedPassageResult> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  const state = await getEngineState(player.id)
  if (!state) {
    return { success: false, error: 'No alchemy engine state found. Start an arc first.' }
  }

  // Import the passage resolver (lazy to avoid circular deps)
  const { resolvePassage } = await import('@/lib/alchemy-engine/passage-resolver')

  // Build prior content from existing BARs for Action/Reflection grounding
  let priorContent: { intakeText?: string; actionText?: string; actionMoveTitle?: string } | undefined

  if (phase === 'action' || phase === 'reflection') {
    const arcStartedAt = state.arcStartedAt ?? new Date(0)
    const priorBars = await db.customBar.findMany({
      where: {
        creatorId: player.id,
        type: { in: ['intake', 'action'] },
        createdAt: { gte: arcStartedAt },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, type: true, description: true, title: true, strandMetadata: true },
    })

    const intakeBar = priorBars.find((b) => b.type === 'intake')
    const actionBar = priorBars.find((b) => b.type === 'action')

    priorContent = {
      intakeText: intakeBar?.description ?? undefined,
      actionText: actionBar?.description ?? undefined,
      actionMoveTitle: actionBar?.title ?? undefined,
    }
  }

  try {
    const resolved = await resolvePassage(phase, state.channel, {
      preferStatic,
      priorContent,
    })

    return {
      success: true,
      situation: resolved.situation,
      friction: resolved.friction,
      invitation: resolved.invitation,
      source: resolved.source,
      aiAvailable: resolved.aiAvailable,
      fallbackReason: resolved.fallbackReason,
      model: resolved.model,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Failed to resolve passage: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// getAlchemyEngineState — Read current arc state for the authenticated player
// ---------------------------------------------------------------------------

/**
 * Get the current Alchemy Engine state for the authenticated player.
 * Returns null if the player has no state or is not authenticated.
 */
export async function getAlchemyEngineState() {
  const player = await getCurrentPlayer()
  if (!player) return null
  return getEngineState(player.id)
}
