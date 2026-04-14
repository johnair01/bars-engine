/**
 * CYOA Composer Build Contract — Locked-Choice State Model
 *
 * Defines the state model for the CYOA Composer that produces immutable
 * build receipts. Face and emotional vector are "locked" after selection
 * and become immutable; other choices remain mutable until the build
 * is finalized.
 *
 * Pattern: GscpProgressBundle immutable-core + spoke-extension.
 * Serialization: JSON blob in PlayerAdventureProgress.stateData
 * (matches CyoaRunState / CampaignHubStateV1 patterns).
 *
 * @see src/lib/generated-spoke-cyoa/types.ts — GscpProgressBundle
 * @see src/lib/campaign-hub/types.ts — CampaignHubStateV1
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Lock status discriminator
// ---------------------------------------------------------------------------

/**
 * A choice field that has not yet been committed.
 * The player can still change it freely.
 */
export type UnlockedChoice<T> = {
  status: 'unlocked'
  /** Current draft value (may be undefined if not yet selected) */
  value: T | null
}

/**
 * A choice field that has been committed and is now immutable.
 * Once locked, the value cannot be changed for this build.
 */
export type LockedChoice<T> = {
  status: 'locked'
  value: T
  /** ISO timestamp when the lock was applied */
  lockedAt: string
}

/** Discriminated union: a choice is either locked or unlocked. */
export type Choice<T> = UnlockedChoice<T> | LockedChoice<T>

// ---------------------------------------------------------------------------
// Choice helpers
// ---------------------------------------------------------------------------

/** Create an unlocked choice with no value yet. */
export function emptyChoice<T>(): UnlockedChoice<T> {
  return { status: 'unlocked', value: null }
}

/** Create an unlocked choice with a draft value. */
export function draftChoice<T>(value: T): UnlockedChoice<T> {
  return { status: 'unlocked', value }
}

/** Lock a choice — value becomes immutable. */
export function lockChoice<T>(value: T): LockedChoice<T> {
  return { status: 'locked', value, lockedAt: new Date().toISOString() }
}

/** Type guard: is this choice locked? */
export function isLocked<T>(choice: Choice<T>): choice is LockedChoice<T> {
  return choice.status === 'locked'
}

/** Type guard: is this choice unlocked? */
export function isUnlocked<T>(choice: Choice<T>): choice is UnlockedChoice<T> {
  return choice.status === 'unlocked'
}

/**
 * Read the current value regardless of lock status.
 * Returns null if unlocked with no draft.
 */
export function choiceValue<T>(choice: Choice<T>): T | null {
  return choice.value
}

// ---------------------------------------------------------------------------
// Narrative template reference (stub — full NarrativeTemplate in AC2+)
// ---------------------------------------------------------------------------

/** Lightweight reference to a NarrativeTemplate, stored in the build. */
export type NarrativeTemplateRef = {
  templateId: string
  templateKind: string
}

// ---------------------------------------------------------------------------
// CyoaBuildState — the in-progress composer state
// ---------------------------------------------------------------------------

/**
 * The full composer state for a build-in-progress.
 *
 * Face and emotionalVector are Choice<> — they lock after selection
 * and become the immutable core of the eventual receipt.
 * narrativeTemplate and mutable fields remain editable until finalization.
 *
 * Serialized to PlayerAdventureProgress.stateData under the
 * `cyoaBuild` key (same JSON-blob pattern as CyoaRunState).
 */
export type CyoaBuildState = {
  v: 1

  /** Unique build identifier (cuid) */
  buildId: string

  /** Campaign context */
  campaignRef: string
  spokeIndex: number

  // -- Lockable core fields (immutable after lock) --------------------------

  /** The GM face selected for this build — locks after selection */
  face: Choice<GameMasterFace>

  /** Emotional vector from daily check-in or manual selection — locks after selection */
  emotionalVector: Choice<EmotionalVector>

  // -- Mutable fields (editable until finalization) -------------------------

  /** Narrative template selection (mutable until build is finalized) */
  narrativeTemplate: NarrativeTemplateRef | null

  /**
   * GM-overridable step ordering for the composer.
   * When null, uses the campaign default ordering.
   * Each string is a step key (e.g. 'face', 'emotion', 'template', 'confirm').
   */
  stepOrder: string[] | null

  /**
   * Mutable bag for additional choices that are not part of the
   * immutable core. Follows the stateData JSON-blob pattern.
   */
  extras: Record<string, unknown>

  // -- Lifecycle ------------------------------------------------------------

  /** Build lifecycle status */
  status: 'drafting' | 'locked' | 'finalized'

  /** ISO — when this build was created */
  createdAt: string

  /** ISO — last modification */
  updatedAt: string
}

// ---------------------------------------------------------------------------
// CyoaBuildReceipt — the immutable output
// ---------------------------------------------------------------------------

/**
 * Immutable build receipt produced when a CyoaBuildState is finalized.
 *
 * Once created, a receipt is NEVER modified. It is the canonical record
 * of what the player chose. The hub stores completed receipts for
 * ledger rendering (hub-as-ledger pattern).
 *
 * Mirrors GscpProgressBundle's immutability guarantee.
 */
export type CyoaBuildReceipt = {
  v: 1

  /** Same buildId from the CyoaBuildState that produced this receipt */
  buildId: string

  /** Campaign context (copied from build state) */
  campaignRef: string
  spokeIndex: number

  /** Locked face — always present in a valid receipt */
  face: GameMasterFace

  /** Locked emotional vector — always present in a valid receipt */
  emotionalVector: EmotionalVector

  /** Resolved narrative template — always present in a valid receipt */
  narrativeTemplate: NarrativeTemplateRef

  /** Snapshot of extras at finalization time */
  extras: Record<string, unknown>

  /** ISO — when this receipt was created (finalization timestamp) */
  createdAt: string
}

// ---------------------------------------------------------------------------
// Checkpoint persistence (mid-spoke)
// ---------------------------------------------------------------------------

/**
 * Checkpoint envelope for mid-spoke persistence.
 *
 * Stored in PlayerAdventureProgress.stateData under the `cyoaBuildCheckpoint` key.
 * On session resume, the revalidation hook reads this to restore composer state.
 * Revalidation fires ONLY on session resume, never mid-session (Diplomat safety).
 */
export type CyoaBuildCheckpoint = {
  v: 1

  /** The serialized build state */
  buildState: CyoaBuildState

  /** ISO — when this checkpoint was saved */
  savedAt: string

  /**
   * Whether this checkpoint needs revalidation on next session resume.
   * Set to true when saving; cleared after revalidation completes.
   */
  needsRevalidation: boolean
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

/**
 * Create a fresh CyoaBuildState for a new composer session.
 */
export function createBuildState(params: {
  buildId: string
  campaignRef: string
  spokeIndex: number
  stepOrder?: string[] | null
}): CyoaBuildState {
  const now = new Date().toISOString()
  return {
    v: 1,
    buildId: params.buildId,
    campaignRef: params.campaignRef,
    spokeIndex: params.spokeIndex,
    face: emptyChoice(),
    emotionalVector: emptyChoice(),
    narrativeTemplate: null,
    stepOrder: params.stepOrder ?? null,
    extras: {},
    status: 'drafting',
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Finalize a build state into an immutable receipt.
 * Returns null if the build is not ready (face or vector still unlocked,
 * or narrative template not selected).
 *
 * The returned receipt is deeply frozen — all nested objects and arrays
 * are immutable at runtime (Object.freeze) and at the type level (Readonly).
 */
export function finalizeReceipt(state: CyoaBuildState): CyoaBuildReceipt | null {
  if (!isLocked(state.face)) return null
  if (!isLocked(state.emotionalVector)) return null
  if (!state.narrativeTemplate) return null

  const receipt: CyoaBuildReceipt = {
    v: 1,
    buildId: state.buildId,
    campaignRef: state.campaignRef,
    spokeIndex: state.spokeIndex,
    face: state.face.value,
    emotionalVector: { ...state.emotionalVector.value },
    narrativeTemplate: { ...state.narrativeTemplate },
    extras: { ...state.extras },
    createdAt: new Date().toISOString(),
  }

  // Deep-freeze the receipt to guarantee runtime immutability
  return deepFreezeReceipt(receipt)
}

/**
 * Deep-freeze an object recursively.
 * Used internally to guarantee receipt immutability at runtime.
 */
function deepFreezeReceipt<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj
  Object.freeze(obj)
  for (const val of Object.values(obj as Record<string, unknown>)) {
    if (val !== null && val !== undefined && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreezeReceipt(val)
    }
  }
  return obj
}

/**
 * Create a checkpoint envelope from the current build state.
 */
export function createCheckpoint(buildState: CyoaBuildState): CyoaBuildCheckpoint {
  return {
    v: 1,
    buildState,
    savedAt: new Date().toISOString(),
    needsRevalidation: true,
  }
}

/**
 * Mark a checkpoint as revalidated (clears the needsRevalidation flag).
 * Returns a new checkpoint — does NOT mutate the input.
 */
export function markRevalidated(checkpoint: CyoaBuildCheckpoint): CyoaBuildCheckpoint {
  return {
    ...checkpoint,
    needsRevalidation: false,
  }
}

// ---------------------------------------------------------------------------
// Serialization — JSON round-trip helpers
// ---------------------------------------------------------------------------

/**
 * Serialize a CyoaBuildState to a JSON-safe object.
 * EmotionalVector is already JSON-safe (plain object with string fields).
 * This is a passthrough — the type system guarantees JSON compatibility.
 */
export function serializeBuildState(state: CyoaBuildState): string {
  return JSON.stringify(state)
}

/**
 * Deserialize a CyoaBuildState from a JSON string.
 * Returns null if the string is not a valid CyoaBuildState.
 */
export function deserializeBuildState(json: string): CyoaBuildState | null {
  try {
    const parsed = JSON.parse(json)
    if (isCyoaBuildState(parsed)) return parsed
    return null
  } catch {
    return null
  }
}

/**
 * Serialize a CyoaBuildCheckpoint to a JSON string.
 */
export function serializeCheckpoint(checkpoint: CyoaBuildCheckpoint): string {
  return JSON.stringify(checkpoint)
}

/**
 * Deserialize a CyoaBuildCheckpoint from a JSON string.
 * Returns null if the string is not a valid CyoaBuildCheckpoint.
 */
export function deserializeCheckpoint(json: string): CyoaBuildCheckpoint | null {
  try {
    const parsed = JSON.parse(json)
    if (isCyoaBuildCheckpoint(parsed)) return parsed
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Type guards (runtime validation at TypeScript boundary)
// ---------------------------------------------------------------------------

/** Validate a Choice<T> shape (does not validate the inner T). */
function isChoiceShape(x: unknown): boolean {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (o.status === 'locked') {
    return o.value !== undefined && typeof o.lockedAt === 'string'
  }
  if (o.status === 'unlocked') {
    return true // value can be null
  }
  return false
}

/** Runtime type guard for CyoaBuildState. */
export function isCyoaBuildState(x: unknown): x is CyoaBuildState {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (o.v !== 1) return false
  if (typeof o.buildId !== 'string') return false
  if (typeof o.campaignRef !== 'string') return false
  if (typeof o.spokeIndex !== 'number') return false
  if (!isChoiceShape(o.face)) return false
  if (!isChoiceShape(o.emotionalVector)) return false
  if (typeof o.status !== 'string') return false
  if (!['drafting', 'locked', 'finalized'].includes(o.status)) return false
  if (typeof o.createdAt !== 'string') return false
  if (typeof o.updatedAt !== 'string') return false
  return true
}

/** Runtime type guard for CyoaBuildReceipt. */
export function isCyoaBuildReceipt(x: unknown): x is CyoaBuildReceipt {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (o.v !== 1) return false
  if (typeof o.buildId !== 'string') return false
  if (typeof o.campaignRef !== 'string') return false
  if (typeof o.spokeIndex !== 'number') return false
  if (typeof o.face !== 'string') return false
  if (!o.emotionalVector || typeof o.emotionalVector !== 'object') return false
  if (!o.narrativeTemplate || typeof o.narrativeTemplate !== 'object') return false
  if (typeof o.createdAt !== 'string') return false
  return true
}

/** Runtime type guard for CyoaBuildCheckpoint. */
export function isCyoaBuildCheckpoint(x: unknown): x is CyoaBuildCheckpoint {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (o.v !== 1) return false
  if (!isCyoaBuildState(o.buildState)) return false
  if (typeof o.savedAt !== 'string') return false
  if (typeof o.needsRevalidation !== 'boolean') return false
  return true
}

// ---------------------------------------------------------------------------
// State-data key constants (for PlayerAdventureProgress.stateData)
// ---------------------------------------------------------------------------

/** Key under which CyoaBuildState is stored in stateData */
export const CYOA_BUILD_STATE_KEY = 'cyoaBuild'

/** Key under which CyoaBuildCheckpoint is stored in stateData */
export const CYOA_BUILD_CHECKPOINT_KEY = 'cyoaBuildCheckpoint'

/** Key under which completed CyoaBuildReceipt[] are stored in hub state */
export const CYOA_BUILD_RECEIPTS_KEY = 'completedBuilds'
