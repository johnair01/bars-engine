/**
 * CYOA Composer — Adaptive Resolution Engine
 *
 * Evaluates already-known player data against step skipConditions to
 * produce a filtered, reordered step sequence for the composer wizard.
 *
 * Data sources that can pre-fill the data bag:
 *   1. Daily check-in  → emotionalVector, channel, altitude, dailyCheckInId
 *   2. Spoke draw      → lockedFace (from CampaignHubSpokeDrawV1.primaryFace)
 *   3. CTA / deep link → lockedFace (pre-determined by campaign invite)
 *   4. Checkpoint       → any field persisted from a prior session
 *
 * The resolver is pure — it does not query the DB. The caller (server action)
 * fetches the raw context and passes it in. This keeps the resolver testable
 * and follows the existing pattern where lib/ modules are pure logic and
 * actions/ handle data access.
 *
 * @see src/lib/cyoa-composer/step-registry.ts — step definitions + skipConditions
 * @see src/actions/alchemy.ts — getTodayCheckIn
 * @see src/lib/campaign-hub/types.ts — CampaignHubSpokeDrawV1.primaryFace
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector, EmotionalChannel } from '@/lib/quest-grammar/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import type {
  ComposerDataBag,
  ComposerStepOverrides,
  ResolvedStep,
  ComposerStepId,
} from './types'
import { resolveStepOrder, getDefaultSteps } from './step-registry'

// ---------------------------------------------------------------------------
// Player Context — input to the adaptive resolver
// ---------------------------------------------------------------------------

/**
 * Raw player context gathered from various data sources before
 * the composer starts. The server action assembles this from DB queries
 * and passes it into the resolver.
 */
export interface PlayerComposerContext {
  // ── Daily Check-in ──────────────────────────────────────────────────
  /** Today's completed daily check-in, if any. */
  dailyCheckIn?: {
    id: string
    channel: string    // EmotionChannel from AlchemyCheckIn (lowercase in DB)
    altitude: string   // AlchemyAltitude
  } | null

  // ── Spoke Draw / CTA ───────────────────────────────────────────────
  /** Face pre-locked from spoke draw (CampaignHubSpokeDrawV1.primaryFace). */
  spokeFace?: GameMasterFace | null

  /** Face pre-locked from a campaign CTA / deep link / invitation. */
  ctaFace?: GameMasterFace | null

  // ── Checkpoint Resume ──────────────────────────────────────────────
  /** Persisted data bag from a prior session's checkpoint. */
  checkpointData?: Partial<ComposerDataBag> | null

  // ── GM Configuration ───────────────────────────────────────────────
  /** GM step ordering overrides for this campaign. */
  stepOverrides?: ComposerStepOverrides | null
}

// ---------------------------------------------------------------------------
// Resolver output
// ---------------------------------------------------------------------------

/**
 * The result of adaptive resolution.
 *
 * Contains:
 *  - resolvedBag: the pre-filled data bag with all known values
 *  - steps: ordered, filtered step sequence for the composer UI
 *  - activeSteps: only the non-skipped steps (convenience)
 *  - skippedSteps: steps that were auto-skipped (for telemetry/debug)
 *  - firstActiveStep: the step the composer should open to
 *  - isComplete: true when all steps are satisfied (ready for confirmation only)
 *  - prefilledSources: map of data keys to their source (for UI provenance)
 */
export interface AdaptiveResolution {
  /** The data bag after all pre-fill sources have been applied. */
  resolvedBag: ComposerDataBag

  /** All steps in resolved order (including skipped). */
  steps: ResolvedStep[]

  /** Only the non-skipped steps the player needs to interact with. */
  activeSteps: ResolvedStep[]

  /** Steps that were auto-skipped because data was pre-filled. */
  skippedSteps: ResolvedStep[]

  /** The first step the composer should render, or null if all done. */
  firstActiveStep: ResolvedStep | null

  /** True if no active steps remain except confirmation. */
  isReadyForConfirmation: boolean

  /**
   * Provenance map: which data keys were pre-filled and from what source.
   * Useful for UI badges ("from today's check-in", "from spoke draw").
   */
  prefilledSources: Map<keyof ComposerDataBag, PrefilledSource>
}

/**
 * Source annotation for a pre-filled value.
 * Enables the composer UI to show where data came from.
 */
export type PrefilledSource =
  | { kind: 'daily_checkin'; checkInId: string }
  | { kind: 'spoke_draw' }
  | { kind: 'cta' }
  | { kind: 'checkpoint' }

// ---------------------------------------------------------------------------
// Channel mapping — DB channel strings → typed EmotionalChannel
// ---------------------------------------------------------------------------

/**
 * Map DB/alchemy channel strings to the quest-grammar EmotionalChannel type.
 * The daily check-in stores lowercase channel names; EmotionalChannel uses title case.
 */
const CHANNEL_MAP: Record<string, EmotionalChannel> = {
  fear: 'Fear',
  anger: 'Anger',
  sadness: 'Sadness',
  joy: 'Joy',
  neutrality: 'Neutrality',
  // Title-case passthrough (in case caller already normalized)
  Fear: 'Fear',
  Anger: 'Anger',
  Sadness: 'Sadness',
  Joy: 'Joy',
  Neutrality: 'Neutrality',
}

const ALTITUDE_SET = new Set<string>(['dissatisfied', 'neutral', 'satisfied'])

// ---------------------------------------------------------------------------
// Core Resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the adaptive step sequence for a composer session.
 *
 * 1. Builds the pre-filled data bag from all available sources.
 *    Priority order (last wins on conflict):
 *      checkpoint → daily check-in → spoke draw → CTA
 *    This means a CTA face override always wins over a checkpoint's face.
 *
 * 2. Evaluates each step's skipCondition against the pre-filled bag.
 *
 * 3. Applies GM step ordering overrides.
 *
 * 4. Returns the full AdaptiveResolution for the composer to render.
 *
 * Pure function — no side effects, no DB access, fully testable.
 */
export function resolveAdaptiveSteps(
  context: PlayerComposerContext,
): AdaptiveResolution {
  const bag: ComposerDataBag = {}
  const sources = new Map<keyof ComposerDataBag, PrefilledSource>()

  // ── Layer 1: Checkpoint data (lowest priority — older session) ───────
  if (context.checkpointData) {
    applyCheckpointData(bag, sources, context.checkpointData)
  }

  // ── Layer 2: Daily check-in (overrides checkpoint emotional data) ────
  if (context.dailyCheckIn) {
    applyDailyCheckIn(bag, sources, context.dailyCheckIn)
  }

  // ── Layer 3: Spoke draw face (overrides checkpoint face) ─────────────
  if (context.spokeFace) {
    bag.lockedFace = context.spokeFace
    sources.set('lockedFace', { kind: 'spoke_draw' })
  }

  // ── Layer 4: CTA face (highest priority — explicit campaign action) ──
  if (context.ctaFace) {
    bag.lockedFace = context.ctaFace
    sources.set('lockedFace', { kind: 'cta' })
  }

  // ── Resolve step ordering ────────────────────────────────────────────
  const steps = resolveStepOrder(bag, context.stepOverrides)
  const activeSteps = steps.filter((s) => !s.skipped)
  const skippedSteps = steps.filter((s) => s.skipped)

  // Confirmation is never "auto-skipped" but may be the only remaining step
  const nonConfirmationActive = activeSteps.filter((s) => s.id !== 'confirmation')
  const isReadyForConfirmation = nonConfirmationActive.length === 0

  const firstActiveStep = activeSteps.length > 0 ? activeSteps[0] : null

  return {
    resolvedBag: bag,
    steps,
    activeSteps,
    skippedSteps,
    firstActiveStep,
    isReadyForConfirmation,
    prefilledSources: sources,
  }
}

// ---------------------------------------------------------------------------
// Data Application Helpers
// ---------------------------------------------------------------------------

/**
 * Apply checkpoint data to the bag.
 * Only copies fields that are actually present in the checkpoint.
 */
function applyCheckpointData(
  bag: ComposerDataBag,
  sources: Map<keyof ComposerDataBag, PrefilledSource>,
  checkpoint: Partial<ComposerDataBag>,
): void {
  const source: PrefilledSource = { kind: 'checkpoint' }

  if (checkpoint.emotionalVector) {
    bag.emotionalVector = checkpoint.emotionalVector
    sources.set('emotionalVector', source)
  }
  if (checkpoint.channel) {
    bag.channel = checkpoint.channel
    sources.set('channel', source)
  }
  if (checkpoint.altitude) {
    bag.altitude = checkpoint.altitude
    sources.set('altitude', source)
  }
  if (checkpoint.lockedFace) {
    bag.lockedFace = checkpoint.lockedFace
    sources.set('lockedFace', source)
  }
  if (checkpoint.narrativeTemplateId) {
    bag.narrativeTemplateId = checkpoint.narrativeTemplateId
    sources.set('narrativeTemplateId', source)
  }
  if (checkpoint.chargeText) {
    bag.chargeText = checkpoint.chargeText
    sources.set('chargeText', source)
  }
  if (checkpoint.dailyCheckInId) {
    bag.dailyCheckInId = checkpoint.dailyCheckInId
    sources.set('dailyCheckInId', source)
  }
}

/**
 * Apply daily check-in data: sets emotionalVector, channel, altitude, dailyCheckInId.
 * Constructs an EmotionalVector from the check-in's channel + altitude.
 *
 * The check-in captures the "from" state. The "to" state defaults to the
 * natural resolution target for that channel (same channel, one altitude up).
 * This is a sensible default that the player can override if they proceed
 * to the emotional_checkin step manually.
 */
function applyDailyCheckIn(
  bag: ComposerDataBag,
  sources: Map<keyof ComposerDataBag, PrefilledSource>,
  checkIn: NonNullable<PlayerComposerContext['dailyCheckIn']>,
): void {
  const channel = CHANNEL_MAP[checkIn.channel]
  if (!channel) return // invalid channel — skip silently

  const altitude = checkIn.altitude
  if (!ALTITUDE_SET.has(altitude)) return // invalid altitude — skip silently

  const typedAltitude = altitude as AlchemyAltitude
  const source: PrefilledSource = { kind: 'daily_checkin', checkInId: checkIn.id }

  // Resolve "to" altitude: one step up from current, capped at 'satisfied'
  const toAltitude = resolveTargetAltitude(typedAltitude)

  const vector: EmotionalVector = {
    channelFrom: channel,
    altitudeFrom: typedAltitude,
    channelTo: channel,
    altitudeTo: toAltitude,
  }

  bag.emotionalVector = vector
  bag.channel = channel
  bag.altitude = typedAltitude
  bag.dailyCheckInId = checkIn.id

  sources.set('emotionalVector', source)
  sources.set('channel', source)
  sources.set('altitude', source)
  sources.set('dailyCheckInId', source)
}

/**
 * Resolve the target altitude: one step up from current.
 * dissatisfied → neutral, neutral → satisfied, satisfied → satisfied (capped).
 */
function resolveTargetAltitude(from: AlchemyAltitude): AlchemyAltitude {
  switch (from) {
    case 'dissatisfied': return 'neutral'
    case 'neutral': return 'satisfied'
    case 'satisfied': return 'satisfied'
    default: return 'neutral'
  }
}

// ---------------------------------------------------------------------------
// Dependency Validation
// ---------------------------------------------------------------------------

/**
 * Validate that a step's required data dependencies are satisfied.
 * Returns an array of missing data keys (empty = all satisfied).
 *
 * This is used by the composer UI to prevent advancement to a step
 * whose dependencies aren't met yet.
 */
export function validateStepDependencies(
  step: ResolvedStep,
  dataBag: ComposerDataBag,
): string[] {
  const missing: string[] = []
  for (const key of step.requiredData) {
    const value = dataBag[key]
    if (value === undefined || value === null) {
      missing.push(key)
    }
  }
  return missing
}

/**
 * Check if a specific step can be entered given the current data bag.
 * Returns true if all required data keys are present.
 */
export function canEnterStep(
  step: ResolvedStep,
  dataBag: ComposerDataBag,
): boolean {
  return validateStepDependencies(step, dataBag).length === 0
}

// ---------------------------------------------------------------------------
// Step Navigation
// ---------------------------------------------------------------------------

/**
 * Find the step at a given index in the active (non-skipped) step list.
 * Returns null if index is out of bounds.
 */
export function getActiveStepAtIndex(
  resolution: AdaptiveResolution,
  index: number,
): ResolvedStep | null {
  if (index < 0 || index >= resolution.activeSteps.length) return null
  return resolution.activeSteps[index]
}

/**
 * Find the index of a step by ID in the active step list.
 * Returns -1 if the step is skipped or not found.
 */
export function getActiveStepIndex(
  resolution: AdaptiveResolution,
  stepId: ComposerStepId,
): number {
  return resolution.activeSteps.findIndex((s) => s.id === stepId)
}

/**
 * Advance the data bag with new step output and re-resolve.
 * Returns a fresh AdaptiveResolution reflecting the updated state.
 *
 * This is the primary "step completion" API: the composer calls this
 * after the player completes a step, merging the new data into the bag
 * and re-evaluating all skipConditions.
 *
 * Pure function — returns new objects, does not mutate inputs.
 */
export function advanceAndResolve(
  currentBag: ComposerDataBag,
  newData: Partial<ComposerDataBag>,
  context: PlayerComposerContext,
): AdaptiveResolution {
  // Merge new data into the bag (new data takes priority)
  const mergedBag: ComposerDataBag = { ...currentBag, ...newData }

  // Re-resolve with the merged bag (re-evaluates all skipConditions)
  const contextWithBag: PlayerComposerContext = {
    ...context,
    // Clear checkpoint data since we're using the live merged bag
    checkpointData: mergedBag,
    // Clear check-in / face overrides — they're already in the merged bag
    dailyCheckIn: null,
    spokeFace: null,
    ctaFace: null,
  }

  // Use direct resolveStepOrder instead of full context resolution
  // since all data is already in the merged bag
  const steps = resolveStepOrder(mergedBag, context.stepOverrides)
  const activeSteps = steps.filter((s) => !s.skipped)
  const skippedSteps = steps.filter((s) => s.skipped)
  const nonConfirmationActive = activeSteps.filter((s) => s.id !== 'confirmation')
  const isReadyForConfirmation = nonConfirmationActive.length === 0

  return {
    resolvedBag: mergedBag,
    steps,
    activeSteps,
    skippedSteps,
    firstActiveStep: activeSteps[0] ?? null,
    isReadyForConfirmation,
    prefilledSources: new Map(), // Sources lost after merge — acceptable for live sessions
  }
}

// ---------------------------------------------------------------------------
// Data Bag → Build State Bridge
// ---------------------------------------------------------------------------

/**
 * Extract the data bag from a CyoaBuildState's Choice fields.
 * Bridges the Choice<T> model (build-contract.ts) to the
 * ComposerDataBag model (composer types).
 *
 * This allows checkpoint-resumed builds to feed into the resolver.
 */
export function buildStateToBag(buildState: {
  face: { status: string; value: GameMasterFace | null }
  emotionalVector: { status: string; value: EmotionalVector | null }
  narrativeTemplate: { templateId: string; templateKind: string } | null
  extras: Record<string, unknown>
}): ComposerDataBag {
  const bag: ComposerDataBag = {}

  // Face
  if (buildState.face.value) {
    bag.lockedFace = buildState.face.value
  }

  // Emotional vector
  if (buildState.emotionalVector.value) {
    const ev = buildState.emotionalVector.value
    bag.emotionalVector = ev
    bag.channel = ev.channelFrom
    bag.altitude = ev.altitudeFrom
  }

  // Narrative template
  if (buildState.narrativeTemplate) {
    bag.narrativeTemplateId = buildState.narrativeTemplate.templateId
  }

  // Charge text from extras
  if (typeof buildState.extras.chargeText === 'string') {
    bag.chargeText = buildState.extras.chargeText
  }

  // Daily check-in ID from extras
  if (typeof buildState.extras.dailyCheckInId === 'string') {
    bag.dailyCheckInId = buildState.extras.dailyCheckInId
  }

  return bag
}
