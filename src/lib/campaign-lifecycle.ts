/**
 * Campaign Lifecycle State Machine
 *
 * Centralised status-transition guards and lifecycle hooks for campaigns.
 * All status mutations must flow through `transitionCampaignStatus()` to
 * guarantee the DRAFT → PENDING_REVIEW → APPROVED → LIVE flow is enforced
 * and direct publish without approval is impossible.
 *
 * Valid transitions:
 *
 *   DRAFT ──────────► PENDING_REVIEW  (steward+ submits for review)
 *   PENDING_REVIEW ──► APPROVED       (admin approves)
 *   PENDING_REVIEW ──► REJECTED       (admin rejects with reason)
 *   REJECTED ────────► PENDING_REVIEW (steward+ re-submits)
 *   APPROVED ────────► LIVE           (admin launches)
 *   LIVE ────────────► ARCHIVED       (admin or steward+ archives)
 *
 * No other transitions are permitted. Notably, DRAFT → LIVE is impossible.
 */

import type { CampaignStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Allowed transitions map — single source of truth
// ---------------------------------------------------------------------------

/** The set of status values a campaign may move *from* to reach the target. */
const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: [],                       // Entry state — nothing transitions TO DRAFT
  PENDING_REVIEW: ['DRAFT', 'REJECTED'],
  APPROVED: ['PENDING_REVIEW'],
  REJECTED: ['PENDING_REVIEW'],
  LIVE: ['APPROVED'],
  ARCHIVED: ['LIVE'],
}

// ---------------------------------------------------------------------------
// Role requirements per transition
// ---------------------------------------------------------------------------

export type RequiredRole = 'steward+' | 'admin'

/**
 * Which role is required for each target status.
 * 'steward+' means admin, owner, or steward on the instance.
 * 'admin' means global admin only.
 */
const TRANSITION_ROLE: Record<CampaignStatus, RequiredRole> = {
  DRAFT: 'steward+',           // not really used (no inbound transition)
  PENDING_REVIEW: 'steward+',  // steward submits for review
  APPROVED: 'admin',           // admin approves
  REJECTED: 'admin',           // admin rejects
  LIVE: 'admin',               // admin launches
  ARCHIVED: 'steward+',        // steward+ or admin archives
}

// ---------------------------------------------------------------------------
// Editable / deletable state sets
// ---------------------------------------------------------------------------

/** Campaigns in these statuses can be edited (content fields). */
const EDITABLE_STATUSES: Set<CampaignStatus> = new Set(['DRAFT', 'REJECTED'])

/** Campaigns in these statuses can be deleted. */
const DELETABLE_STATUSES: Set<CampaignStatus> = new Set(['DRAFT'])

// ---------------------------------------------------------------------------
// Validation result types
// ---------------------------------------------------------------------------

export type TransitionValidation =
  | { valid: true; requiredRole: RequiredRole }
  | { valid: false; reason: string }

export type OperationValidation =
  | { valid: true }
  | { valid: false; reason: string }

// ---------------------------------------------------------------------------
// Core guard — validates a status transition
// ---------------------------------------------------------------------------

/**
 * Check whether a status transition is allowed by the state machine.
 * Returns the required role if valid, or a human-readable error if not.
 *
 * This is the **only** function that should gate status changes.
 */
export function validateTransition(
  from: CampaignStatus,
  to: CampaignStatus
): TransitionValidation {
  if (from === to) {
    return { valid: false, reason: `Campaign is already in "${from}" status.` }
  }

  const allowedFrom = ALLOWED_TRANSITIONS[to]
  if (!allowedFrom || !allowedFrom.includes(from)) {
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". ` +
        describeAllowedSources(to),
    }
  }

  return { valid: true, requiredRole: TRANSITION_ROLE[to] }
}

/**
 * Human-readable description of which source statuses can reach the target.
 */
function describeAllowedSources(target: CampaignStatus): string {
  const sources = ALLOWED_TRANSITIONS[target]
  if (!sources || sources.length === 0) {
    return `"${target}" is an entry state and cannot be reached via transition.`
  }
  return `Only campaigns in [${sources.join(', ')}] status may move to "${target}".`
}

// ---------------------------------------------------------------------------
// Operation guards — edit & delete
// ---------------------------------------------------------------------------

/**
 * Check whether a campaign in the given status may be edited (content fields).
 */
export function validateEdit(status: CampaignStatus): OperationValidation {
  if (EDITABLE_STATUSES.has(status)) {
    return { valid: true }
  }
  return {
    valid: false,
    reason: `Cannot edit a campaign with status "${status}". ` +
      `Only campaigns in [${[...EDITABLE_STATUSES].join(', ')}] status may be edited.`,
  }
}

/**
 * Check whether a campaign in the given status may be deleted.
 */
export function validateDelete(status: CampaignStatus): OperationValidation {
  if (DELETABLE_STATUSES.has(status)) {
    return { valid: true }
  }
  return {
    valid: false,
    reason: `Cannot delete a campaign with status "${status}". ` +
      `Only campaigns in [${[...DELETABLE_STATUSES].join(', ')}] status may be deleted.`,
  }
}

// ---------------------------------------------------------------------------
// Lifecycle hooks — extensible event system
// ---------------------------------------------------------------------------

export type CampaignLifecycleEvent = {
  campaignId: string
  from: CampaignStatus
  to: CampaignStatus
  actorId: string
  /** Additional metadata (e.g., rejection reason) */
  metadata?: Record<string, unknown>
  timestamp: Date
}

export type LifecycleHook = (event: CampaignLifecycleEvent) => Promise<void>

/**
 * Registry of lifecycle hooks keyed by target status.
 * Hooks fire *after* the DB update succeeds.
 */
const hookRegistry: Map<CampaignStatus, LifecycleHook[]> = new Map()

/**
 * Register a hook that fires when a campaign transitions to the given status.
 * Returns an unregister function.
 */
export function onTransition(
  targetStatus: CampaignStatus,
  hook: LifecycleHook
): () => void {
  const existing = hookRegistry.get(targetStatus) ?? []
  existing.push(hook)
  hookRegistry.set(targetStatus, existing)

  return () => {
    const hooks = hookRegistry.get(targetStatus)
    if (hooks) {
      const idx = hooks.indexOf(hook)
      if (idx >= 0) hooks.splice(idx, 1)
    }
  }
}

/**
 * Fire all registered hooks for a transition. Errors are logged but do not
 * roll back the transition — hooks are side-effects, not gates.
 */
export async function fireLifecycleHooks(
  event: CampaignLifecycleEvent
): Promise<void> {
  const hooks = hookRegistry.get(event.to) ?? []
  for (const hook of hooks) {
    try {
      await hook(event)
    } catch (err) {
      console.error(
        `[campaign-lifecycle] Hook error on ${event.from}→${event.to} for campaign ${event.campaignId}:`,
        err
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience: list next possible statuses from current
// ---------------------------------------------------------------------------

/**
 * Given a current status, return the list of statuses the campaign may
 * transition to. Useful for UI to show available actions.
 */
export function getAvailableTransitions(
  currentStatus: CampaignStatus
): { status: CampaignStatus; requiredRole: RequiredRole }[] {
  const results: { status: CampaignStatus; requiredRole: RequiredRole }[] = []

  for (const [target, sources] of Object.entries(ALLOWED_TRANSITIONS)) {
    if ((sources as CampaignStatus[]).includes(currentStatus)) {
      results.push({
        status: target as CampaignStatus,
        requiredRole: TRANSITION_ROLE[target as CampaignStatus],
      })
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  LIVE: 'Live',
  ARCHIVED: 'Archived',
}

/**
 * Whether a campaign in this status is visible to the public (non-authenticated).
 */
export function isPubliclyVisible(status: CampaignStatus): boolean {
  return status === 'LIVE'
}

/**
 * Whether a campaign in this status is considered "active" (not archived/rejected).
 */
export function isActive(status: CampaignStatus): boolean {
  return status !== 'ARCHIVED'
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { ALLOWED_TRANSITIONS, EDITABLE_STATUSES, DELETABLE_STATUSES }
