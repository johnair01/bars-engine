'use server'

/**
 * CYOA Build Checkpoint — Server Actions
 *
 * Auto-save checkpoint on every node transition during the composer flow.
 * Follows the existing `saveAdventureProgress()` upsert + shallow-merge pattern.
 *
 * The checkpoint fires on every node transition (auto-save contract AC10).
 * Revalidation fires ONLY on session resume (AC11 — Diplomat emotional safety).
 *
 * @see src/actions/adventure-progress.ts — saveAdventureProgress pattern
 * @see src/lib/cyoa-composer/checkpoint-persistence.ts — pure checkpoint logic
 * @see src/lib/cyoa/build-contract.ts — CyoaBuildState, CyoaBuildCheckpoint
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import type { CyoaBuildState } from '@/lib/cyoa/build-contract'
import { isCyoaBuildState, CYOA_BUILD_STATE_KEY } from '@/lib/cyoa/build-contract'
import {
  buildCheckpointPatch,
  restoreCheckpoint,
  shouldCheckpointOnTransition,
  type CheckpointRestoreResult,
} from '@/lib/cyoa-composer/checkpoint-persistence'

// ---------------------------------------------------------------------------
// Save checkpoint — fires on every node transition
// ---------------------------------------------------------------------------

/**
 * Auto-save the CYOA composer build state as a checkpoint.
 *
 * Called on every node transition during an active composer session.
 * Performs an upsert into PlayerAdventureProgress.stateData using
 * the same shallow-merge pattern as `saveAdventureProgress()`.
 *
 * @param adventureId - The adventure being played
 * @param currentNodeId - The node the player just transitioned to
 * @param buildState - Current CyoaBuildState from the composer
 * @returns Empty object on success, `{ error }` on failure
 */
export async function saveComposerCheckpoint(
  adventureId: string,
  currentNodeId: string,
  buildState: CyoaBuildState,
): Promise<{ error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    // Load existing progress for shallow merge
    const existing = await db.playerAdventureProgress.findUnique({
      where: { playerId_adventureId: { playerId: player.id, adventureId } },
    })

    let prevState: Record<string, unknown> = {}
    if (existing?.stateData) {
      try {
        prevState = JSON.parse(existing.stateData) as Record<string, unknown>
      } catch {
        /* ignore malformed JSON — start fresh */
      }
    }

    // Build the checkpoint patch (pure)
    const patch = buildCheckpointPatch(buildState)

    // Shallow merge: preserve existing keys (cyoaArtifactLedger, etc.)
    const merged = { ...prevState, ...patch }

    await db.playerAdventureProgress.upsert({
      where: {
        playerId_adventureId: { playerId: player.id, adventureId },
      },
      create: {
        playerId: player.id,
        adventureId,
        currentNodeId,
        stateData: JSON.stringify(merged),
      },
      update: {
        currentNodeId,
        stateData: JSON.stringify(merged),
      },
    })

    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { error: `Checkpoint save failed: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// Transition-aware checkpoint — check + save in one call
// ---------------------------------------------------------------------------

/**
 * Check whether a checkpoint should fire and save it if so.
 *
 * This is the primary entry point for the "auto-save on every node
 * transition" contract. It combines the guard check with the save
 * in a single server action call, reducing client round-trips.
 *
 * If there's no active CyoaBuildState in stateData, this is a no-op.
 * If the build is already finalized, this is a no-op.
 *
 * @param adventureId - The adventure being played
 * @param currentNodeId - Node the player just transitioned to
 * @param buildState - Current CyoaBuildState from the composer (optional)
 * @returns `{ saved: true }` if checkpoint fired, `{ saved: false }` if skipped,
 *          or `{ error }` on failure
 */
export async function checkpointOnNodeTransition(
  adventureId: string,
  currentNodeId: string,
  buildState?: CyoaBuildState | null,
): Promise<{ saved: boolean; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { saved: false, error: 'Not logged in' }

  try {
    // If caller provides the build state, use it directly
    if (buildState) {
      if (buildState.status === 'finalized') {
        return { saved: false }
      }
      const result = await saveComposerCheckpoint(adventureId, currentNodeId, buildState)
      if (result.error) return { saved: false, error: result.error }
      return { saved: true }
    }

    // Otherwise, check existing stateData for an active build
    const progress = await db.playerAdventureProgress.findUnique({
      where: { playerId_adventureId: { playerId: player.id, adventureId } },
    })

    if (!progress?.stateData) return { saved: false }

    let stateData: Record<string, unknown> = {}
    try {
      stateData = JSON.parse(progress.stateData) as Record<string, unknown>
    } catch {
      return { saved: false }
    }

    // Guard: should we checkpoint?
    if (!shouldCheckpointOnTransition(stateData, currentNodeId)) {
      return { saved: false }
    }

    // Extract the existing build state and re-save with updated timestamp
    const rawState = stateData[CYOA_BUILD_STATE_KEY]
    if (!rawState || !isCyoaBuildState(rawState)) {
      return { saved: false }
    }

    const result = await saveComposerCheckpoint(
      adventureId,
      currentNodeId,
      rawState as CyoaBuildState,
    )
    if (result.error) return { saved: false, error: result.error }
    return { saved: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { saved: false, error: `Checkpoint transition failed: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// Load checkpoint — for session resume
// ---------------------------------------------------------------------------

/**
 * Load the most recent composer checkpoint for an adventure.
 *
 * Used on session resume to restore the composer state.
 * The `needsRevalidation` flag indicates whether revalidation should run.
 *
 * @param adventureId - The adventure to load checkpoint for
 * @returns The checkpoint restore result, or error
 */
export async function loadComposerCheckpoint(
  adventureId: string,
): Promise<CheckpointRestoreResult & { error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { found: false, error: 'Not logged in' }

  try {
    const progress = await db.playerAdventureProgress.findUnique({
      where: { playerId_adventureId: { playerId: player.id, adventureId } },
    })

    if (!progress?.stateData) return { found: false }

    let stateData: Record<string, unknown> = {}
    try {
      stateData = JSON.parse(progress.stateData) as Record<string, unknown>
    } catch {
      return { found: false }
    }

    return restoreCheckpoint(stateData)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { found: false, error: `Checkpoint load failed: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// Clear checkpoint — after build finalization
// ---------------------------------------------------------------------------

/**
 * Clear the checkpoint data from stateData after build finalization.
 *
 * Preserves the finalized build state but removes the checkpoint envelope.
 * Other stateData keys are preserved (shallow merge).
 *
 * @param adventureId - The adventure to clear checkpoint for
 * @returns Empty object on success, `{ error }` on failure
 */
export async function clearComposerCheckpoint(
  adventureId: string,
): Promise<{ error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    const progress = await db.playerAdventureProgress.findUnique({
      where: { playerId_adventureId: { playerId: player.id, adventureId } },
    })

    if (!progress?.stateData) return {}

    let stateData: Record<string, unknown> = {}
    try {
      stateData = JSON.parse(progress.stateData) as Record<string, unknown>
    } catch {
      return {}
    }

    // Remove checkpoint key, preserve everything else
    const { cyoaBuildCheckpoint: _removed, ...rest } = stateData

    await db.playerAdventureProgress.update({
      where: { playerId_adventureId: { playerId: player.id, adventureId } },
      data: {
        stateData: JSON.stringify(rest),
      },
    })

    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { error: `Checkpoint clear failed: ${msg}` }
  }
}
