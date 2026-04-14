/**
 * CYOA Composer Build Contract — Types
 *
 * Immutable build receipt produced by the CYOA Composer.
 * Once a player completes the composer, a CyoaBuild is frozen and
 * becomes the canonical record of their face + emotional vector +
 * narrative template selection for a given campaign spoke.
 *
 * Follows GscpProgressBundle immutable-core pattern:
 *   - All core fields are Readonly after creation
 *   - Hub stores completed builds as ledger entries (no fan-out)
 *   - Mid-spoke checkpoints are mutable drafts; only the final
 *     receipt is frozen
 *
 * @see src/lib/generated-spoke-cyoa/types.ts — GscpProgressBundle pattern
 * @see src/lib/campaign-hub/types.ts — CampaignHubStateV1 ledger pattern
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector, PersonalMoveType } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// WAVE Move Spine — the 4-move throughput sequence
// ---------------------------------------------------------------------------

/** Ordered sequence of WAVE moves chosen/resolved during the composer. */
export type WaveMoveSpine = Readonly<{
  /** Primary move for this build (the move the player is "running"). */
  primary: PersonalMoveType
  /** Full ordered sequence the composer resolved (length 1–4). */
  sequence: readonly PersonalMoveType[]
}>

// ---------------------------------------------------------------------------
// Campaign Snapshot — frozen campaign context at build time
// ---------------------------------------------------------------------------

/**
 * Snapshot of campaign state captured at build-creation time.
 * Prevents stale reads: the hub can render the receipt without
 * querying PlayerAdventureProgress or other tables.
 */
export type CampaignSnapshot = Readonly<{
  campaignRef: string
  spokeIndex: number
  kotterStage: number
  hexagramId?: number
  changingLines?: readonly number[]
  instanceName: string
}>

// ---------------------------------------------------------------------------
// CyoaBuild — the immutable build receipt
// ---------------------------------------------------------------------------

/**
 * Immutable build receipt produced by the CYOA Composer.
 *
 * After the player completes all composer steps, the receipt is
 * frozen (Object.freeze at runtime, Readonly at type level).
 * The hub stores an array of these as its ledger — each completed
 * spoke appends one CyoaBuild.
 *
 * Core fields (face, emotionalVector, waveMoveSpine,
 * narrativeTemplateKey, campaignSnapshot) are NEVER mutated
 * after creation.
 */
export type CyoaBuild = Readonly<{
  /** Unique receipt ID (cuid). */
  id: string

  /** The Game Master face locked for this build. */
  face: GameMasterFace

  /** Emotional vector resolved from daily check-in or composer input. */
  emotionalVector: Readonly<EmotionalVector>

  /** WAVE move spine — primary move + ordered sequence. */
  waveMoveSpine: WaveMoveSpine

  /**
   * Key into the NarrativeTemplate registry.
   * Links this build to a shared-spine + kind-specific template.
   */
  narrativeTemplateKey: string

  /** Frozen campaign context at build time (hub self-containment). */
  campaignSnapshot: CampaignSnapshot

  /**
   * Blueprint key for passage/node resolution.
   * Follows existing GscpProgressBundle.blueprintKey pattern.
   */
  blueprintKey: string

  /** ISO 8601 timestamp — when the composer completed this build. */
  createdAt: string

  /** Player ID who created this build. */
  playerId: string
}>

// ---------------------------------------------------------------------------
// CyoaBuildDraft — mutable composer work-in-progress
// ---------------------------------------------------------------------------

/**
 * Mutable draft state used during the composer flow.
 * Each field becomes non-null as the player completes composer steps.
 * Only converted to a CyoaBuild when all required fields are present.
 *
 * Mid-spoke checkpoints persist the draft; revalidation fires
 * ONLY on session resume (Diplomat emotional safety constraint).
 */
export type CyoaBuildDraft = {
  /** Partial — set when player locks a face. */
  face?: GameMasterFace
  /** Partial — set when emotional vector is resolved (check-in or manual). */
  emotionalVector?: EmotionalVector
  /** Partial — set when WAVE move is selected. */
  waveMoveSpine?: {
    primary?: PersonalMoveType
    sequence?: PersonalMoveType[]
  }
  /** Partial — set when narrative template is chosen. */
  narrativeTemplateKey?: string
  /** Partial — set at draft creation from current campaign state. */
  campaignSnapshot?: {
    campaignRef: string
    spokeIndex: number
    kotterStage: number
    hexagramId?: number
    changingLines?: number[]
    instanceName: string
  }
  /** ISO 8601 — last checkpoint save. */
  savedAt?: string
  /**
   * Whether this draft needs revalidation on next session resume.
   * Set to true when a session ends mid-compose.
   * Cleared after successful revalidation.
   */
  needsRevalidation?: boolean
}

// ---------------------------------------------------------------------------
// Validation constants
// ---------------------------------------------------------------------------

/** Valid PersonalMoveType values (mirrors the type union). */
const VALID_PERSONAL_MOVES: readonly PersonalMoveType[] = [
  'wakeUp',
  'cleanUp',
  'growUp',
  'showUp',
] as const

/** Valid EmotionalChannel values. */
const VALID_CHANNELS = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality'] as const

/** Valid AlchemyAltitude values. */
const VALID_ALTITUDES = ['dissatisfied', 'neutral', 'satisfied'] as const

// ---------------------------------------------------------------------------
// Validation error types
// ---------------------------------------------------------------------------

/**
 * Structured validation error for CyoaBuild factory.
 * Each entry identifies which field failed and why.
 */
export type CyoaBuildValidationError = {
  field: string
  message: string
}

/**
 * Result of CyoaBuild validation — either valid or a list of errors.
 * Follows discriminated-union pattern for exhaustive handling.
 */
export type CyoaBuildValidationResult =
  | { valid: true; errors: [] }
  | { valid: false; errors: CyoaBuildValidationError[] }

// ---------------------------------------------------------------------------
// CyoaBuildInput — structured factory input
// ---------------------------------------------------------------------------

/**
 * Explicit input DTO for the CyoaBuild factory.
 * Unlike CyoaBuildDraft (partial, mutable), this declares exactly
 * what the factory needs. The factory validates every field before
 * assembling the frozen receipt.
 */
export type CyoaBuildInput = {
  id: string
  playerId: string
  face: GameMasterFace
  emotionalVector: EmotionalVector
  waveMoveSpine: {
    primary: PersonalMoveType
    sequence: PersonalMoveType[]
  }
  narrativeTemplateKey: string
  campaignSnapshot: {
    campaignRef: string
    spokeIndex: number
    kotterStage: number
    hexagramId?: number
    changingLines?: number[]
    instanceName: string
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a CyoaBuildInput, returning all errors found.
 * Does NOT throw — returns a structured result so callers can
 * surface field-level feedback in the composer UI.
 */
export function validateCyoaBuildInput(
  input: Partial<CyoaBuildInput> | null | undefined,
): CyoaBuildValidationResult {
  const errors: CyoaBuildValidationError[] = []

  if (!input) {
    errors.push({ field: 'input', message: 'Input is required' })
    return { valid: false, errors }
  }

  // -- Scalar identifiers ---------------------------------------------------

  if (!input.id || typeof input.id !== 'string' || input.id.trim() === '') {
    errors.push({ field: 'id', message: 'Build ID is required and must be a non-empty string' })
  }

  if (!input.playerId || typeof input.playerId !== 'string' || input.playerId.trim() === '') {
    errors.push({
      field: 'playerId',
      message: 'Player ID is required and must be a non-empty string',
    })
  }

  // -- Face -----------------------------------------------------------------

  if (!input.face) {
    errors.push({ field: 'face', message: 'Game Master face is required' })
  } else if (!(GAME_MASTER_FACES as readonly string[]).includes(input.face)) {
    errors.push({
      field: 'face',
      message: `Invalid face "${input.face}". Must be one of: ${GAME_MASTER_FACES.join(', ')}`,
    })
  }

  // -- Emotional Vector -----------------------------------------------------

  if (!input.emotionalVector) {
    errors.push({ field: 'emotionalVector', message: 'Emotional vector is required' })
  } else {
    const ev = input.emotionalVector
    if (!ev.channelFrom || !(VALID_CHANNELS as readonly string[]).includes(ev.channelFrom)) {
      errors.push({
        field: 'emotionalVector.channelFrom',
        message: `channelFrom must be one of: ${VALID_CHANNELS.join(', ')}`,
      })
    }
    if (!ev.channelTo || !(VALID_CHANNELS as readonly string[]).includes(ev.channelTo)) {
      errors.push({
        field: 'emotionalVector.channelTo',
        message: `channelTo must be one of: ${VALID_CHANNELS.join(', ')}`,
      })
    }
    if (!ev.altitudeFrom || !(VALID_ALTITUDES as readonly string[]).includes(ev.altitudeFrom)) {
      errors.push({
        field: 'emotionalVector.altitudeFrom',
        message: `altitudeFrom must be one of: ${VALID_ALTITUDES.join(', ')}`,
      })
    }
    if (!ev.altitudeTo || !(VALID_ALTITUDES as readonly string[]).includes(ev.altitudeTo)) {
      errors.push({
        field: 'emotionalVector.altitudeTo',
        message: `altitudeTo must be one of: ${VALID_ALTITUDES.join(', ')}`,
      })
    }
  }

  // -- WAVE Move Spine ------------------------------------------------------

  if (!input.waveMoveSpine) {
    errors.push({ field: 'waveMoveSpine', message: 'WAVE move spine is required' })
  } else {
    const spine = input.waveMoveSpine
    if (!spine.primary) {
      errors.push({ field: 'waveMoveSpine.primary', message: 'Primary move is required' })
    } else if (!(VALID_PERSONAL_MOVES as readonly string[]).includes(spine.primary)) {
      errors.push({
        field: 'waveMoveSpine.primary',
        message: `Invalid primary move "${spine.primary}". Must be one of: ${VALID_PERSONAL_MOVES.join(', ')}`,
      })
    }

    if (!spine.sequence || !Array.isArray(spine.sequence) || spine.sequence.length === 0) {
      errors.push({
        field: 'waveMoveSpine.sequence',
        message: 'Move sequence is required and must contain at least one move',
      })
    } else {
      for (let i = 0; i < spine.sequence.length; i++) {
        if (!(VALID_PERSONAL_MOVES as readonly string[]).includes(spine.sequence[i])) {
          errors.push({
            field: `waveMoveSpine.sequence[${i}]`,
            message: `Invalid move "${spine.sequence[i]}" at index ${i}`,
          })
        }
      }
    }
  }

  // -- Narrative Template Key -----------------------------------------------

  if (
    !input.narrativeTemplateKey ||
    typeof input.narrativeTemplateKey !== 'string' ||
    input.narrativeTemplateKey.trim() === ''
  ) {
    errors.push({
      field: 'narrativeTemplateKey',
      message: 'Narrative template key is required and must be a non-empty string',
    })
  }

  // -- Campaign Snapshot ----------------------------------------------------

  if (!input.campaignSnapshot) {
    errors.push({ field: 'campaignSnapshot', message: 'Campaign snapshot is required' })
  } else {
    const snap = input.campaignSnapshot
    if (!snap.campaignRef || typeof snap.campaignRef !== 'string') {
      errors.push({
        field: 'campaignSnapshot.campaignRef',
        message: 'Campaign reference is required',
      })
    }
    if (typeof snap.spokeIndex !== 'number' || snap.spokeIndex < 0) {
      errors.push({
        field: 'campaignSnapshot.spokeIndex',
        message: 'Spoke index must be a non-negative number',
      })
    }
    if (typeof snap.kotterStage !== 'number' || snap.kotterStage < 0) {
      errors.push({
        field: 'campaignSnapshot.kotterStage',
        message: 'Kotter stage must be a non-negative number',
      })
    }
    if (!snap.instanceName || typeof snap.instanceName !== 'string') {
      errors.push({
        field: 'campaignSnapshot.instanceName',
        message: 'Instance name is required',
      })
    }
    if (snap.changingLines !== undefined && !Array.isArray(snap.changingLines)) {
      errors.push({
        field: 'campaignSnapshot.changingLines',
        message: 'Changing lines must be an array of numbers when present',
      })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }
  return { valid: true, errors: [] }
}

// ---------------------------------------------------------------------------
// Type guards & factories
// ---------------------------------------------------------------------------

/** Type guard: checks all required CyoaBuild fields are present in a draft. */
export function isCyoaBuildComplete(draft: CyoaBuildDraft): boolean {
  return !!(
    draft.face &&
    draft.emotionalVector &&
    draft.waveMoveSpine?.primary &&
    draft.waveMoveSpine?.sequence &&
    draft.waveMoveSpine.sequence.length > 0 &&
    draft.narrativeTemplateKey &&
    draft.campaignSnapshot?.campaignRef &&
    draft.campaignSnapshot?.instanceName
  )
}

// ---------------------------------------------------------------------------
// Deep-freeze helper
// ---------------------------------------------------------------------------

/**
 * Deep-freeze an object and all nested objects/arrays.
 * Returns the same reference, now frozen at every level.
 */
function deepFreeze<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }
  Object.freeze(obj)
  const values = Array.isArray(obj) ? obj : Object.values(obj as Record<string, unknown>)
  for (const val of values) {
    if (val !== null && val !== undefined && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val)
    }
  }
  return obj
}

// ---------------------------------------------------------------------------
// CyoaBuild factory — primary entry point
// ---------------------------------------------------------------------------

/**
 * Assemble and validate a CyoaBuild receipt from structured inputs.
 *
 * This is the canonical factory for producing immutable build receipts.
 * It validates every required field, generates the blueprintKey, stamps
 * createdAt, and returns a deeply frozen CyoaBuild.
 *
 * @throws Error with detailed field-level messages if validation fails
 *
 * @example
 * ```ts
 * const build = createCyoaBuild({
 *   id: 'cuid_abc123',
 *   playerId: 'player_xyz',
 *   face: 'shaman',
 *   emotionalVector: { channelFrom: 'Fear', altitudeFrom: 'dissatisfied', channelTo: 'Joy', altitudeTo: 'satisfied' },
 *   waveMoveSpine: { primary: 'wakeUp', sequence: ['wakeUp', 'cleanUp'] },
 *   narrativeTemplateKey: 'hero-journey-basic',
 *   campaignSnapshot: { campaignRef: 'camp_1', spokeIndex: 0, kotterStage: 1, instanceName: 'Spring 2026' },
 * })
 * // build is deeply frozen — Object.isFrozen(build) === true
 * ```
 */
export function createCyoaBuild(input: CyoaBuildInput): CyoaBuild {
  const validation = validateCyoaBuildInput(input)
  if (!validation.valid) {
    const summary = validation.errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')
    throw new Error(`CyoaBuild validation failed:\n${summary}`)
  }

  const build: CyoaBuild = {
    id: input.id,
    face: input.face,
    emotionalVector: { ...input.emotionalVector },
    waveMoveSpine: {
      primary: input.waveMoveSpine.primary,
      sequence: [...input.waveMoveSpine.sequence],
    },
    narrativeTemplateKey: input.narrativeTemplateKey,
    campaignSnapshot: {
      campaignRef: input.campaignSnapshot.campaignRef,
      spokeIndex: input.campaignSnapshot.spokeIndex,
      kotterStage: input.campaignSnapshot.kotterStage,
      hexagramId: input.campaignSnapshot.hexagramId,
      changingLines: input.campaignSnapshot.changingLines
        ? [...input.campaignSnapshot.changingLines]
        : undefined,
      instanceName: input.campaignSnapshot.instanceName,
    },
    blueprintKey: `cyoa_build_${input.face}_${input.waveMoveSpine.primary}`,
    createdAt: new Date().toISOString(),
    playerId: input.playerId,
  }

  return deepFreeze(build)
}

/**
 * Freeze a completed draft into an immutable CyoaBuild receipt.
 * Delegates to createCyoaBuild after extracting fields from the draft.
 * Throws if the draft is incomplete.
 *
 * @param draft — completed CyoaBuildDraft (all fields present)
 * @param id — unique receipt ID (cuid)
 * @param playerId — authenticated player ID
 * @returns Frozen CyoaBuild receipt
 */
export function freezeCyoaBuild(
  draft: CyoaBuildDraft,
  id: string,
  playerId: string,
): CyoaBuild {
  // Delegate to createCyoaBuild which handles validation + deep freeze
  return createCyoaBuild({
    id,
    playerId,
    face: draft.face!,
    emotionalVector: draft.emotionalVector!,
    waveMoveSpine: {
      primary: draft.waveMoveSpine!.primary!,
      sequence: draft.waveMoveSpine!.sequence ?? [],
    },
    narrativeTemplateKey: draft.narrativeTemplateKey!,
    campaignSnapshot: {
      campaignRef: draft.campaignSnapshot!.campaignRef,
      spokeIndex: draft.campaignSnapshot!.spokeIndex ?? 0,
      kotterStage: draft.campaignSnapshot!.kotterStage ?? 0,
      hexagramId: draft.campaignSnapshot!.hexagramId,
      changingLines: draft.campaignSnapshot!.changingLines,
      instanceName: draft.campaignSnapshot!.instanceName,
    },
  })
}

// ---------------------------------------------------------------------------
// Hub ledger entry — stored in CampaignHubStateV1 extension
// ---------------------------------------------------------------------------

/**
 * Minimal ledger entry stored in the hub for receipt echo.
 * Contains the full CyoaBuild so the hub is self-contained —
 * no fan-out queries to PlayerAdventureProgress needed.
 */
export type CyoaBuildLedgerEntry = Readonly<{
  /** Spoke index this build completed. */
  spokeIndex: number
  /** The full frozen build receipt. */
  build: CyoaBuild
  /** ISO 8601 — when hub recorded this completion. */
  recordedAt: string
}>
