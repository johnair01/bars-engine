'use client'

/**
 * useRevalidationTriggerGuard — Combined trigger guard for CYOA Composer
 * checkpoint revalidation.
 *
 * Revalidation fires ONLY when BOTH conditions are true:
 *   1. isSessionResume — the player returned after the heartbeat went stale
 *      (detected by useSessionResumeDetection)
 *   2. isAtBranchPoint — the current node/step is a branch point where the
 *      player faces a meaningful choice that could be affected by stale data
 *      (computed by shouldRevalidateOnResume from branch-point-detection)
 *
 * This is the "Diplomat emotional safety" constraint: we never interrupt a
 * player mid-session with revalidation prompts. Only on session resume, and
 * only at positions where the player can meaningfully act on changed data.
 *
 * Four possible states:
 *   - Fresh session, any node       → NO revalidation (not a resume)
 *   - Resumed session, linear node  → NO revalidation (nothing to re-decide)
 *   - Resumed session, branch point → REVALIDATION (both conditions met)
 *   - Fresh session, branch point   → NO revalidation (not a resume)
 *
 * After revalidation completes (or is dismissed), the consumer calls
 * `acknowledgeRevalidation()` which clears both the session-resume flag
 * and marks the checkpoint as revalidated.
 *
 * @see src/hooks/useSessionResumeDetection.ts — heartbeat-based resume detection
 * @see src/lib/cyoa-composer/branch-point-detection.ts — shouldRevalidateOnResume
 * @see src/lib/cyoa-composer/checkpoint-persistence.ts — restoreCheckpoint
 * @see src/lib/cyoa/build-contract.ts — CyoaBuildCheckpoint, markRevalidated
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import {
  useSessionResumeDetection,
  formatSessionAge,
  type SessionResumeDetectionOptions,
} from '@/hooks/useSessionResumeDetection'
import {
  shouldRevalidateOnResume,
  detectBranchPoint,
  computeRevalidationChecks,
  type BranchPointResult,
  type RevalidationCheck,
} from '@/lib/cyoa-composer/branch-point-detection'
import type { CyoaBuildCheckpoint } from '@/lib/cyoa/build-contract'
import { markRevalidated } from '@/lib/cyoa/build-contract'
import type { ComposerStepId, ComposerDataBag } from '@/lib/cyoa-composer/types'

// ─── Input ──────────────────────────────────────────────────────────────────

export interface UseRevalidationTriggerGuardInput {
  /**
   * The restored checkpoint from loadComposerCheckpoint().
   * Null if no checkpoint exists (fresh build — never triggers revalidation).
   */
  checkpoint: CyoaBuildCheckpoint | null

  /** Current passage/node ID in the adventure graph */
  nodeId: string

  /** Number of outgoing choices at the current node */
  choiceCount: number

  /** Current composer step (if in composer flow) */
  composerStep?: ComposerStepId | null

  /**
   * Restored data bag from the checkpoint (for aspect-level staleness checks).
   * When provided alongside freshDataBag, enables detailed revalidation checks.
   */
  restoredDataBag?: ComposerDataBag

  /**
   * Freshly-resolved data bag from current context (for comparison).
   * When provided alongside restoredDataBag, enables detailed revalidation checks.
   */
  freshDataBag?: ComposerDataBag

  /** Options for session-resume detection (heartbeat interval, staleness, etc.) */
  sessionResumeOptions?: SessionResumeDetectionOptions

  /**
   * Whether the guard is enabled. When false, never triggers revalidation.
   * Useful for disabling during build finalization or admin previews.
   * @default true
   */
  enabled?: boolean
}

// ─── Output ─────────────────────────────────────────────────────────────────

export interface RevalidationTriggerGuardResult {
  /**
   * Whether revalidation should fire RIGHT NOW.
   * True only when both isSessionResume AND isAtBranchPoint are true,
   * AND the checkpoint has needsRevalidation === true.
   *
   * This is the single boolean the UI checks to show the revalidation prompt.
   */
  shouldRevalidate: boolean

  // ── Individual condition flags (for debugging / UI messaging) ──────────

  /**
   * Whether this mount is a resumed session (heartbeat went stale).
   * Null while detection is initializing.
   */
  isSessionResume: boolean | null

  /** Whether the current node/step is a branch point. */
  isAtBranchPoint: boolean

  /** Whether the checkpoint has the needsRevalidation flag set. */
  checkpointNeedsRevalidation: boolean

  // ── Detailed revalidation info ────────────────────────────────────────

  /** Branch-point classification details (kind, reason) */
  branchPointDetails: BranchPointResult

  /**
   * Aspect-level staleness checks (which specific data may have changed).
   * Only populated when shouldRevalidate is true AND both data bags are provided.
   */
  staleAspects: RevalidationCheck[]

  /** Human-readable time-away message (e.g. "2 hours") */
  timeAwayMessage: string

  /** Session age in milliseconds (null if first visit) */
  sessionAge: number | null

  // ── Actions ───────────────────────────────────────────────────────────

  /**
   * Acknowledge that revalidation has been handled.
   * Clears shouldRevalidate to false and marks the checkpoint as revalidated.
   * Returns the updated checkpoint (with needsRevalidation: false).
   *
   * Call this after the player confirms their choices or dismisses the prompt.
   */
  acknowledgeRevalidation: () => CyoaBuildCheckpoint | null

  /**
   * Dismiss revalidation without fully processing it.
   * Equivalent to acknowledgeRevalidation — the player chose to skip re-confirming.
   */
  dismissRevalidation: () => void
}

// ─── Hook Implementation ────────────────────────────────────────────────────

/**
 * Combined revalidation trigger guard.
 *
 * Wires together session-resume detection and branch-point analysis.
 * Returns `shouldRevalidate: true` ONLY when both conditions are met,
 * implementing the Diplomat emotional safety constraint.
 */
export function useRevalidationTriggerGuard(
  input: UseRevalidationTriggerGuardInput,
): RevalidationTriggerGuardResult {
  const {
    checkpoint,
    nodeId,
    choiceCount,
    composerStep,
    restoredDataBag,
    freshDataBag,
    sessionResumeOptions,
    enabled = true,
  } = input

  // ── Session-resume detection ──────────────────────────────────────────────

  const sessionResume = useSessionResumeDetection({
    ...sessionResumeOptions,
    enabled,
  })

  // ── Branch-point detection (pure, memoized) ───────────────────────────────

  const branchPointDetails = useMemo(
    () => detectBranchPoint(nodeId, choiceCount, composerStep),
    [nodeId, choiceCount, composerStep],
  )

  const isAtBranchPoint = branchPointDetails.isBranchPoint

  // ── Checkpoint revalidation flag ──────────────────────────────────────────

  const checkpointNeedsRevalidation = checkpoint?.needsRevalidation ?? false

  // ── Combined trigger: BOTH conditions must be true ────────────────────────
  //
  // The core invariant: revalidation fires ONLY when:
  //   (1) isSessionResume === true   (player returned after stale heartbeat)
  //   (2) isAtBranchPoint === true   (current position has meaningful choices)
  //   (3) checkpoint.needsRevalidation === true (checkpoint flagged for revalidation)
  //   (4) enabled === true           (guard is active)
  //
  // This uses shouldRevalidateOnResume as the canonical gate, which already
  // checks conditions (2) and (3). We add condition (1) from session-resume
  // detection and condition (4) from the enabled flag.

  // Track whether user has already acknowledged this revalidation
  const [acknowledged, setAcknowledged] = useState(false)

  // Reset acknowledged state when checkpoint or node changes
  useEffect(() => {
    setAcknowledged(false)
  }, [checkpoint?.savedAt, nodeId])

  const shouldRevalidate = useMemo(() => {
    // Guard disabled
    if (!enabled) return false

    // Already acknowledged this cycle
    if (acknowledged) return false

    // Session detection still initializing
    if (sessionResume.isResumedSession === null) return false

    // Condition 1: Must be a session resume
    if (!sessionResume.isResumedSession) return false

    // Conditions 2 + 3: Branch point AND checkpoint needs revalidation
    // shouldRevalidateOnResume checks both internally
    return shouldRevalidateOnResume(checkpoint, nodeId, choiceCount, composerStep)
  }, [
    enabled,
    acknowledged,
    sessionResume.isResumedSession,
    checkpoint,
    nodeId,
    choiceCount,
    composerStep,
  ])

  // ── Aspect-level staleness checks ─────────────────────────────────────────

  const staleAspects = useMemo(() => {
    if (!shouldRevalidate) return []
    if (!restoredDataBag || !freshDataBag) return []
    return computeRevalidationChecks(restoredDataBag, freshDataBag)
  }, [shouldRevalidate, restoredDataBag, freshDataBag])

  // ── Time-away messaging ───────────────────────────────────────────────────

  const timeAwayMessage = useMemo(
    () => formatSessionAge(sessionResume.sessionAge),
    [sessionResume.sessionAge],
  )

  // ── Acknowledgment actions ────────────────────────────────────────────────

  const acknowledgeRevalidation = useCallback((): CyoaBuildCheckpoint | null => {
    // Mark this revalidation as handled
    setAcknowledged(true)

    // Clear the session-resume flag so it doesn't fire again
    sessionResume.acknowledgeResume()

    // Return updated checkpoint with needsRevalidation: false
    if (checkpoint) {
      return markRevalidated(checkpoint)
    }
    return null
  }, [checkpoint, sessionResume])

  const dismissRevalidation = useCallback((): void => {
    // Dismiss is the same as acknowledge — player chose to skip
    setAcknowledged(true)
    sessionResume.acknowledgeResume()
  }, [sessionResume])

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    shouldRevalidate,

    // Individual condition flags
    isSessionResume: sessionResume.isResumedSession,
    isAtBranchPoint,
    checkpointNeedsRevalidation,

    // Detailed info
    branchPointDetails,
    staleAspects,
    timeAwayMessage,
    sessionAge: sessionResume.sessionAge,

    // Actions
    acknowledgeRevalidation,
    dismissRevalidation,
  }
}
