/**
 * CYOA Composer — Branch-Point Detection
 *
 * Identifies revalidation-eligible branch points in the CYOA spoke flow.
 * Revalidation fires ONLY at branch points on session resume — never
 * mid-session (Diplomat emotional safety constraint).
 *
 * A branch point is a position in the spoke flow where the player faces
 * a meaningful choice that could be affected by stale data (e.g., a
 * check-in that expired, a template that was removed, a face that was
 * restricted by a GM config change).
 *
 * Branch-point types:
 *   - CHOICE_NODE: A passage node with multiple outgoing choices (≥ 2)
 *   - COMPOSER_STEP_ENTRY: Entry into a composer step that offers selection
 *   - PORTAL_FORK: Portal_N / Room_N structural fork in campaign navigation
 *   - SPOKE_ENTRY: Initial entry into a spoke (always a branch point)
 *
 * Design:
 *   - Pure functions, no side effects, fully testable
 *   - Node classification is additive — new branch-point patterns can be
 *     registered without modifying existing logic
 *   - Integrates with checkpoint-persistence: `shouldRevalidateOnResume`
 *     checks both the checkpoint's `needsRevalidation` flag AND whether
 *     the current position is a branch point
 *   - Follows existing revalidateCampaignPortalRoomChoices pattern for
 *     Portal_N / Room_N detection
 *
 * @see src/lib/cyoa-composer/checkpoint-persistence.ts — checkpoint save/restore
 * @see src/lib/cyoa/build-contract.ts — CyoaBuildCheckpoint.needsRevalidation
 * @see src/lib/cyoa/filter-choices.ts — revalidateCampaignPortalRoomChoices pattern
 */

import type { ComposerStepId, ComposerDataBag } from './types'
import type { CyoaBuildCheckpoint } from '@/lib/cyoa/build-contract'

// ---------------------------------------------------------------------------
// Branch-Point Classification
// ---------------------------------------------------------------------------

/**
 * Classification of a branch point in the spoke flow.
 * Each variant represents a different structural reason why
 * a node qualifies as a revalidation-eligible fork.
 */
export type BranchPointKind =
  | 'choice_node'           // Passage with ≥ 2 outgoing choices
  | 'composer_step_entry'   // Entry into a composer step offering selection
  | 'portal_fork'           // Portal_N / Room_N structural fork
  | 'spoke_entry'           // Initial entry into a spoke adventure

/**
 * Result of branch-point detection for a given node.
 */
export interface BranchPointResult {
  /** Whether this node is a branch point eligible for revalidation. */
  isBranchPoint: boolean
  /** Classification of the branch point (null if not a branch point). */
  kind: BranchPointKind | null
  /** Human-readable reason for the classification (for debugging/logging). */
  reason: string
}

// ---------------------------------------------------------------------------
// Node ID Pattern Matchers
// ---------------------------------------------------------------------------

/** Portal node pattern: Portal_1 through Portal_8 */
const PORTAL_NODE_PATTERN = /^Portal_[1-8]$/

/** Room node pattern: Room_1, Room_2, etc. */
const ROOM_NODE_PATTERN = /^Room_\d+$/

/** Spoke entry node pattern: spoke entry nodes start with these prefixes */
const SPOKE_ENTRY_PREFIXES = ['spoke_entry', 'spoke_start', 'start']

/** Terminal node pattern: nodes that end the spoke (never branch points) */
const TERMINAL_NODE_PATTERN = /^(terminal|gscp_terminal|end|complete|finish)/i

// ---------------------------------------------------------------------------
// Core Detection — Node Classification
// ---------------------------------------------------------------------------

/**
 * Classify whether a node ID represents a structural branch point
 * based on its naming pattern alone (without choice data).
 *
 * This is the lightweight check that works without passage/choice data.
 * For full classification including choice-count analysis, use
 * `detectBranchPoint()`.
 *
 * @param nodeId — the passage/node ID in the adventure graph
 * @returns BranchPointResult with classification
 */
export function classifyNodeById(nodeId: string): BranchPointResult {
  // Portal fork nodes
  if (PORTAL_NODE_PATTERN.test(nodeId)) {
    return {
      isBranchPoint: true,
      kind: 'portal_fork',
      reason: `Portal node ${nodeId} is a structural fork in campaign navigation`,
    }
  }

  // Room fork nodes
  if (ROOM_NODE_PATTERN.test(nodeId)) {
    return {
      isBranchPoint: true,
      kind: 'portal_fork',
      reason: `Room node ${nodeId} is a structural fork in campaign navigation`,
    }
  }

  // Spoke entry nodes
  const lowerNodeId = nodeId.toLowerCase()
  if (SPOKE_ENTRY_PREFIXES.some((prefix) => lowerNodeId === prefix || lowerNodeId.startsWith(prefix + '_'))) {
    return {
      isBranchPoint: true,
      kind: 'spoke_entry',
      reason: `Spoke entry node ${nodeId} is always a branch point for initial revalidation`,
    }
  }

  // Terminal nodes are never branch points
  if (TERMINAL_NODE_PATTERN.test(nodeId)) {
    return {
      isBranchPoint: false,
      kind: null,
      reason: `Terminal node ${nodeId} — no branching possible`,
    }
  }

  // No structural classification — needs choice data for full detection
  return {
    isBranchPoint: false,
    kind: null,
    reason: `Node ${nodeId} has no structural branch-point pattern — use detectBranchPoint() with choice data`,
  }
}

// ---------------------------------------------------------------------------
// Core Detection — Full Branch-Point Analysis
// ---------------------------------------------------------------------------

/**
 * Full branch-point detection for a node, incorporating both
 * structural patterns (node ID) and runtime data (choice count).
 *
 * This is the primary entry point for branch-point detection.
 *
 * @param nodeId — the passage/node ID
 * @param choiceCount — number of outgoing choices from this node
 * @param composerStep — the current composer step (if in composer flow)
 * @returns BranchPointResult with classification
 */
export function detectBranchPoint(
  nodeId: string,
  choiceCount: number,
  composerStep?: ComposerStepId | null,
): BranchPointResult {
  // Step 1: Check structural classification (node ID patterns)
  const structural = classifyNodeById(nodeId)
  if (structural.isBranchPoint) {
    return structural
  }

  // Step 2: Check if this is a composer step entry with selections
  if (composerStep && isSelectionStep(composerStep)) {
    return {
      isBranchPoint: true,
      kind: 'composer_step_entry',
      reason: `Composer step '${composerStep}' offers player selection — revalidation eligible`,
    }
  }

  // Step 3: Check choice count (≥ 2 outgoing choices = fork point)
  if (choiceCount >= 2) {
    return {
      isBranchPoint: true,
      kind: 'choice_node',
      reason: `Node ${nodeId} has ${choiceCount} outgoing choices — fork point`,
    }
  }

  // Not a branch point
  return {
    isBranchPoint: false,
    kind: null,
    reason: `Node ${nodeId} with ${choiceCount} choice(s) is not a branch point`,
  }
}

// ---------------------------------------------------------------------------
// Composer Step Classification
// ---------------------------------------------------------------------------

/**
 * Composer steps that involve player selection (branch points for revalidation).
 * These steps offer multiple options; data may have changed between sessions.
 *
 * Note: 'charge_text' is free-text input (not a selection from options),
 * and 'confirmation' is a review step — neither is a branch point.
 */
const SELECTION_STEPS: ReadonlySet<ComposerStepId> = new Set([
  'emotional_checkin',
  'face_selection',
  'narrative_template',
])

/**
 * Check if a composer step is a selection step (involves choosing
 * from options, as opposed to free-text input or confirmation).
 */
export function isSelectionStep(stepId: ComposerStepId): boolean {
  return SELECTION_STEPS.has(stepId)
}

// ---------------------------------------------------------------------------
// Session-Resume Revalidation Gate
// ---------------------------------------------------------------------------

/**
 * Determine whether revalidation should fire at the current position
 * on session resume.
 *
 * Revalidation fires when ALL of these are true:
 *   1. A checkpoint exists with `needsRevalidation === true`
 *   2. The current node/step is a branch point
 *
 * This is the "Diplomat emotional safety" gate: we only ask the player
 * to re-confirm choices at positions where they can meaningfully act
 * on changed data. Linear passages (single-choice nodes) skip
 * revalidation because there's nothing to re-decide.
 *
 * @param checkpoint — the persisted checkpoint (from restoreCheckpoint)
 * @param nodeId — current passage/node ID
 * @param choiceCount — number of outgoing choices at this node
 * @param composerStep — current composer step (if in composer flow)
 * @returns Whether revalidation should fire
 */
export function shouldRevalidateOnResume(
  checkpoint: CyoaBuildCheckpoint | null,
  nodeId: string,
  choiceCount: number,
  composerStep?: ComposerStepId | null,
): boolean {
  // No checkpoint → nothing to revalidate
  if (!checkpoint) return false

  // Checkpoint doesn't need revalidation → skip
  if (!checkpoint.needsRevalidation) return false

  // Check if current position is a branch point
  const branchPoint = detectBranchPoint(nodeId, choiceCount, composerStep)
  return branchPoint.isBranchPoint
}

// ---------------------------------------------------------------------------
// Revalidation Context — what needs checking on session resume
// ---------------------------------------------------------------------------

/**
 * Aspects of the build state that may need revalidation on session resume.
 * Each aspect maps to a data source that could change between sessions.
 */
export type RevalidationAspect =
  | 'emotional_vector'        // Daily check-in may have changed
  | 'face_availability'       // GM may have restricted faces
  | 'template_availability'   // Templates may have been added/removed
  | 'campaign_config'         // GM step overrides may have changed

/**
 * Revalidation check result for a single aspect.
 */
export interface RevalidationCheck {
  aspect: RevalidationAspect
  /** Whether this aspect needs revalidation. */
  stale: boolean
  /** Human-readable description of what changed (for UI messaging). */
  message: string
}

/**
 * Determine which aspects of the build state may need revalidation
 * given a restored data bag and fresh context.
 *
 * This is called AFTER `shouldRevalidateOnResume` returns true.
 * It tells the revalidation UI which specific fields to highlight.
 *
 * @param restoredBag — data bag from the checkpoint
 * @param freshBag — freshly-resolved data bag from current context
 * @returns Array of revalidation checks (aspects that are stale)
 */
export function computeRevalidationChecks(
  restoredBag: ComposerDataBag,
  freshBag: ComposerDataBag,
): RevalidationCheck[] {
  const checks: RevalidationCheck[] = []

  // Check emotional vector staleness
  // If a new daily check-in has occurred, the emotional vector may differ
  if (restoredBag.dailyCheckInId !== freshBag.dailyCheckInId && freshBag.dailyCheckInId) {
    checks.push({
      aspect: 'emotional_vector',
      stale: true,
      message: 'A new daily check-in has been completed since your last session',
    })
  }

  // Check face availability
  // If the restored face is no longer present in the fresh bag, it was restricted
  if (
    restoredBag.lockedFace &&
    freshBag.lockedFace &&
    restoredBag.lockedFace !== freshBag.lockedFace
  ) {
    checks.push({
      aspect: 'face_availability',
      stale: true,
      message: `Your selected face may have changed from ${restoredBag.lockedFace}`,
    })
  }

  // Check template availability
  if (
    restoredBag.narrativeTemplateId &&
    freshBag.narrativeTemplateId !== undefined &&
    restoredBag.narrativeTemplateId !== freshBag.narrativeTemplateId
  ) {
    checks.push({
      aspect: 'template_availability',
      stale: true,
      message: 'The available narrative templates may have changed',
    })
  }

  return checks
}

// ---------------------------------------------------------------------------
// Convenience: isBranchPoint (simple boolean utility)
// ---------------------------------------------------------------------------

/**
 * Simple boolean utility: is this node a branch point?
 *
 * Use this when you just need the flag without the classification details.
 * For full details (kind, reason), use `detectBranchPoint()`.
 *
 * @param nodeId — the passage/node ID
 * @param choiceCount — number of outgoing choices (default 0)
 * @param composerStep — current composer step if applicable
 */
export function isBranchPoint(
  nodeId: string,
  choiceCount: number = 0,
  composerStep?: ComposerStepId | null,
): boolean {
  return detectBranchPoint(nodeId, choiceCount, composerStep).isBranchPoint
}
