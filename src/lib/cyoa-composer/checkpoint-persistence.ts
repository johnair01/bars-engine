/**
 * CYOA Composer — Checkpoint Persistence (Auto-Save on Node Transition)
 *
 * Fires on every node transition during the composer flow, persisting the
 * current CyoaBuildState as a checkpoint in PlayerAdventureProgress.stateData.
 *
 * This follows the existing `saveAdventureProgress` shallow-merge pattern:
 *   - CyoaBuildState is serialized under the `cyoaBuild` key
 *   - CyoaBuildCheckpoint is serialized under the `cyoaBuildCheckpoint` key
 *   - Other stateData keys (cyoaArtifactLedger, etc.) are preserved
 *
 * Revalidation fires ONLY on session resume — never mid-session
 * (Diplomat emotional safety constraint). This module only handles
 * the checkpoint _save_ side; revalidation is in a separate module.
 *
 * @see src/actions/adventure-progress.ts — saveAdventureProgress pattern
 * @see src/lib/cyoa/build-contract.ts — CyoaBuildState, createCheckpoint
 * @see src/lib/generated-spoke-cyoa/types.ts — GscpProgressBundle pattern
 */

import type { CyoaBuildState, CyoaBuildCheckpoint } from '@/lib/cyoa/build-contract'
import {
  createCheckpoint,
  CYOA_BUILD_STATE_KEY,
  CYOA_BUILD_CHECKPOINT_KEY,
  isCyoaBuildState,
} from '@/lib/cyoa/build-contract'

// ---------------------------------------------------------------------------
// Checkpoint payload builder
// ---------------------------------------------------------------------------

/**
 * Shape of the stateData patch produced by checkpoint persistence.
 * This gets shallow-merged into PlayerAdventureProgress.stateData.
 *
 * Keys match the constants in build-contract.ts.
 */
export type CheckpointStatePatch = {
  [CYOA_BUILD_STATE_KEY]: CyoaBuildState
  [CYOA_BUILD_CHECKPOINT_KEY]: CyoaBuildCheckpoint
}

/**
 * Build the stateData patch for a checkpoint save.
 *
 * Pure function — does not touch the DB. The caller (server action)
 * passes the result into `saveAdventureProgress()` or an equivalent upsert.
 *
 * @param buildState - Current CyoaBuildState from the composer
 * @returns The stateData patch to merge into PlayerAdventureProgress
 */
export function buildCheckpointPatch(
  buildState: CyoaBuildState,
): CheckpointStatePatch {
  // Update the timestamp on the state itself
  const updatedState: CyoaBuildState = {
    ...buildState,
    updatedAt: new Date().toISOString(),
  }

  const checkpoint = createCheckpoint(updatedState)

  return {
    [CYOA_BUILD_STATE_KEY]: updatedState,
    [CYOA_BUILD_CHECKPOINT_KEY]: checkpoint,
  }
}

// ---------------------------------------------------------------------------
// Restore from checkpoint
// ---------------------------------------------------------------------------

/**
 * Result of restoring a checkpoint from stateData.
 */
export type CheckpointRestoreResult =
  | { found: true; buildState: CyoaBuildState; checkpoint: CyoaBuildCheckpoint; needsRevalidation: boolean }
  | { found: false }

/**
 * Attempt to restore a CyoaBuildState from persisted stateData.
 *
 * Looks for the checkpoint envelope first (preferred — contains
 * needsRevalidation flag), then falls back to the raw build state key.
 *
 * Pure function — does not touch the DB. The caller passes in the
 * already-parsed stateData record.
 *
 * @param stateData - Parsed stateData from PlayerAdventureProgress
 * @returns Restored checkpoint data, or { found: false } if nothing saved
 */
export function restoreCheckpoint(
  stateData: Record<string, unknown>,
): CheckpointRestoreResult {
  // Try checkpoint envelope first
  const rawCheckpoint = stateData[CYOA_BUILD_CHECKPOINT_KEY]
  if (rawCheckpoint && typeof rawCheckpoint === 'object') {
    const cp = rawCheckpoint as Record<string, unknown>
    if (
      cp.v === 1 &&
      typeof cp.savedAt === 'string' &&
      typeof cp.needsRevalidation === 'boolean' &&
      cp.buildState &&
      isCyoaBuildState(cp.buildState)
    ) {
      return {
        found: true,
        buildState: cp.buildState as CyoaBuildState,
        checkpoint: rawCheckpoint as CyoaBuildCheckpoint,
        needsRevalidation: cp.needsRevalidation as boolean,
      }
    }
  }

  // Fallback: raw build state key
  const rawState = stateData[CYOA_BUILD_STATE_KEY]
  if (rawState && isCyoaBuildState(rawState)) {
    // Wrap in a checkpoint envelope (mark as needing revalidation since
    // we don't know when this was saved without an envelope)
    const checkpoint = createCheckpoint(rawState as CyoaBuildState)
    return {
      found: true,
      buildState: rawState as CyoaBuildState,
      checkpoint,
      needsRevalidation: true,
    }
  }

  return { found: false }
}

// ---------------------------------------------------------------------------
// Merge stateData with checkpoint patch (mirrors saveAdventureProgress logic)
// ---------------------------------------------------------------------------

/**
 * Merge an existing stateData record with a checkpoint patch.
 *
 * Follows the exact same shallow-merge strategy as `saveAdventureProgress()`:
 * incoming keys overwrite existing keys; keys not present in the patch
 * are preserved (cyoaArtifactLedger, cyoaHexagramState, gscp, etc.).
 *
 * @param existing - Current stateData (from DB)
 * @param patch - Checkpoint patch from `buildCheckpointPatch()`
 * @returns Merged stateData ready for DB persist
 */
export function mergeCheckpointIntoState(
  existing: Record<string, unknown>,
  patch: CheckpointStatePatch,
): Record<string, unknown> {
  return { ...existing, ...patch }
}

// ---------------------------------------------------------------------------
// Node-transition checkpoint should-save guard
// ---------------------------------------------------------------------------

/**
 * Determine whether a checkpoint save should fire for this node transition.
 *
 * Returns true for every transition during an active composer session.
 * This implements the "auto-save on every node transition" contract.
 *
 * The guard is intentionally permissive: if a CyoaBuildState exists in
 * the stateData, we checkpoint. This is cheap (single upsert, shallow merge)
 * and prevents data loss from browser crashes, tab closure, etc.
 *
 * @param stateData - Current stateData from PlayerAdventureProgress
 * @param currentNodeId - The node being transitioned to
 * @returns true if a checkpoint save should fire
 */
export function shouldCheckpointOnTransition(
  stateData: Record<string, unknown>,
  currentNodeId: string,
): boolean {
  // No active build → nothing to checkpoint
  const rawState = stateData[CYOA_BUILD_STATE_KEY]
  if (!rawState || !isCyoaBuildState(rawState)) return false

  // Already finalized → no more checkpoints needed
  const state = rawState as CyoaBuildState
  if (state.status === 'finalized') return false

  // Active draft or locked build → checkpoint on every transition
  // (Regardless of node type — simpler, safer, matches spec "every node transition")
  return true
}

// ---------------------------------------------------------------------------
// Compute checkpoint node metadata
// ---------------------------------------------------------------------------

/**
 * Metadata tracked alongside the checkpoint for debugging and analytics.
 * Not part of the CyoaBuild receipt — purely operational.
 */
export type CheckpointNodeMeta = {
  /** The node ID the player transitioned to */
  nodeId: string
  /** ISO timestamp of the transition */
  transitionedAt: string
  /** Step the composer was on at checkpoint time */
  composerStep?: string
}

/**
 * Build checkpoint node metadata for the current transition.
 */
export function buildCheckpointNodeMeta(
  nodeId: string,
  composerStep?: string,
): CheckpointNodeMeta {
  return {
    nodeId,
    transitionedAt: new Date().toISOString(),
    composerStep,
  }
}
