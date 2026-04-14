/**
 * CYOA Composer — Build Contract Types
 *
 * The Composer is a universal, adaptive player-facing wizard that produces
 * immutable CyoaBuild receipts (face + emotional vector + narrative template).
 *
 * GM can override step ordering per campaign. Steps adapt based on
 * pre-existing data (e.g. completed daily check-in pre-fills emotional vector).
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector, EmotionalChannel } from '@/lib/quest-grammar/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'

// ─── Composer Step System ────────────────────────────────────────────────────

/**
 * Unique identifier for each composer step.
 * Steps produce specific fields on the CyoaBuild receipt.
 */
export type ComposerStepId =
  | 'emotional_checkin'     // Produces: emotionalVector (channel + altitude)
  | 'face_selection'        // Produces: lockedFace (GameMasterFace)
  | 'narrative_template'    // Produces: narrativeTemplateId
  | 'charge_text'           // Produces: chargeText (player intention)
  | 'confirmation'          // Produces: nothing new — freezes receipt

/**
 * Keys available in the composer's accumulated data bag.
 * Each step reads from / writes to this bag.
 */
export type ComposerDataKey =
  | 'emotionalVector'
  | 'channel'
  | 'altitude'
  | 'lockedFace'
  | 'narrativeTemplateId'
  | 'chargeText'
  | 'dailyCheckInId'

/**
 * The data bag accumulated across composer steps.
 * Partial until confirmation step freezes it into a CyoaBuild receipt.
 */
export interface ComposerDataBag {
  /** Resolved emotional vector (from check-in or manual selection) */
  emotionalVector?: EmotionalVector
  /** Emotional channel shorthand (derived from vector or selected directly) */
  channel?: EmotionalChannel
  /** Altitude shorthand (derived from vector or selected directly) */
  altitude?: AlchemyAltitude
  /** The Game Master face locked for this build */
  lockedFace?: GameMasterFace
  /** Selected narrative template ID */
  narrativeTemplateId?: string
  /** Player's charge text / intention statement */
  chargeText?: string
  /** If emotional vector was pre-filled from a daily check-in */
  dailyCheckInId?: string
}

/**
 * Condition function that determines whether a step should be skipped.
 * Receives the current accumulated data bag.
 * Returns true to SKIP the step (data already present).
 */
export type SkipCondition = (data: ComposerDataBag) => boolean

/**
 * A single step in the composer wizard.
 *
 * Steps are ordered by `priority` (lower = earlier).
 * GM can override priorities per campaign to reorder the wizard.
 * Steps with satisfied `skipCondition` are skipped automatically.
 */
export interface StepDefinition {
  /** Unique step identifier */
  id: ComposerStepId

  /** Display label for the step (player-facing) */
  label: string

  /**
   * Sort priority — lower numbers run first.
   * Default ordering: 10, 20, 30, 40, 50 (spaced for GM insertion).
   */
  priority: number

  /**
   * Data keys this step requires to be present before it can run.
   * If any required key is missing, the composer will not advance past
   * the blocking step until its own dependencies are satisfied.
   */
  requiredData: ComposerDataKey[]

  /**
   * Data keys this step produces when completed.
   * Used by the composer to track what data is available for downstream steps.
   */
  producesData: ComposerDataKey[]

  /**
   * Condition under which this step is automatically skipped.
   * Returns true when the step's output data is already present
   * (e.g. emotional vector pre-filled from daily check-in).
   * A null/undefined skipCondition means the step is never skipped.
   */
  skipCondition?: SkipCondition
}

// ─── GM Override ─────────────────────────────────────────────────────────────

/**
 * Per-step override entry stored in the DB JSON column.
 * Supports both reordering (priority) and disabling (enabled: false).
 */
export interface ComposerStepOverrideEntry {
  /** Custom sort priority. When omitted, uses the step's default. */
  priority?: number
  /** When false, the step is forcibly skipped regardless of skipCondition. */
  enabled?: boolean
}

/**
 * Per-campaign step ordering override from the GM.
 * Stored as JSON in Instance.composerStepOverrides / AdventureTemplate.composerStepOverrides.
 *
 * Shape: { steps: [{ key: ComposerStepId, enabled: boolean, order: number }] }
 * Also accepts legacy flat format: { [stepId]: number } (priority-only).
 *
 * Unmentioned steps keep defaults and remain enabled.
 */
export type ComposerStepOverrides = Partial<Record<ComposerStepId, number | ComposerStepOverrideEntry>>

/**
 * Structured array format for composerStepOverrides as stored in Prisma JSON column.
 * This is the canonical DB persistence shape.
 * At the TypeScript boundary, parseComposerStepOverrides normalizes this into ComposerStepOverrides.
 */
export interface ComposerStepOverridesDb {
  steps: Array<{
    key: ComposerStepId
    enabled: boolean
    order: number
  }>
}

// ─── Resolved Step Ordering ──────────────────────────────────────────────────

/**
 * A fully resolved step with its effective priority
 * (after GM overrides have been applied).
 */
export interface ResolvedStep extends StepDefinition {
  /** True if this step's skipCondition returned true */
  skipped: boolean
  /** The effective priority after GM override (may differ from default) */
  effectivePriority: number
}
