/**
 * Orientation Quest — Checkpoint Persistence
 *
 * Defines the named checkpoint transitions in the orientation quest lifecycle
 * and provides pure (non-DB) utilities for building, serialising, and
 * deserialising checkpoint records.
 *
 * Database writes are handled by the server-action layer
 * (src/actions/orientation-checkpoint.ts) which imports from here.
 * This module has no Prisma import so it is safe for both server and client
 * bundles.
 *
 * ## Named Checkpoints
 *
 * Six transitions are defined; each triggers a DB upsert of the full packet:
 *
 *   SESSION_INIT   — meta-packet created; all sub-packets start as 'pending'.
 *   FACE_ENTER     — player opens a face path (pending → in_progress).
 *   PAYLOAD_PATCH  — player answers a beat node; payload field(s) updated.
 *   FACE_SUBMIT    — player submits a proposal from a face (in_progress → complete).
 *   FACE_SKIP      — player explicitly skips a face (→ skipped).
 *   SESSION_CLOSE  — session closed by the player or SLA fallback (→ closed).
 *
 * @see .specify/specs/orientation-quest/spec.md (Sub-AC 4b)
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type {
  OrientationMetaPacket,
  FaceSubPacket,
  FaceSubPacketPayload,
  FaceSubPacketState,
} from './types'

// ---------------------------------------------------------------------------
// Checkpoint name enum
// ---------------------------------------------------------------------------

/**
 * The six defined transition points at which the OrientationMetaPacket state
 * is persisted to the `orientation_sessions` DB table.
 *
 * Each checkpoint name is stored verbatim in `orientation_sessions.lastCheckpoint`
 * so that audit queries can reconstruct a player's path through the session.
 */
export type CheckpointName =
  | 'SESSION_INIT'    // Packet created; all sub-packets pending/empty
  | 'FACE_ENTER'      // Player entered a face path (pending → in_progress)
  | 'PAYLOAD_PATCH'   // Player answered a beat node (payload field(s) updated)
  | 'FACE_SUBMIT'     // Player submitted a proposal (in_progress → complete)
  | 'FACE_SKIP'       // Player skipped a face (→ skipped)
  | 'SESSION_CLOSE'   // Session closed (active/submitted → closed)

/** Ordered canonical sequence of checkpoints for documentation/validation. */
export const CHECKPOINT_SEQUENCE: CheckpointName[] = [
  'SESSION_INIT',
  'FACE_ENTER',
  'PAYLOAD_PATCH',
  'FACE_SUBMIT',
  'FACE_SKIP',
  'SESSION_CLOSE',
]

// ---------------------------------------------------------------------------
// Checkpoint record — the shape written to / read from the DB
// ---------------------------------------------------------------------------

/**
 * The shape of the data that is upserted into `orientation_sessions`.
 * All fields mirror the Prisma model exactly.
 */
export interface OrientationCheckpointRecord {
  /** Surrogate cuid — assigned by the DB on first insert. */
  id: string
  /** Maps to OrientationMetaPacket.packetId (unique natural key). */
  packetId: string
  /** Owning player ID. */
  playerId: string
  /** Mirrors OrientationMetaPacket.sessionState (active | submitted | closed). */
  sessionState: 'active' | 'submitted' | 'closed'
  /** Mirrors OrientationMetaPacket.submissionPath. */
  submissionPath: string
  /** Full OrientationMetaPacket serialised as JSON. */
  packetJson: string
  /** The named checkpoint that triggered this write. */
  lastCheckpoint: CheckpointName
  /** ISO 8601 timestamp of the checkpoint write. */
  checkpointAt: string
  /**
   * Quest node ID the player was at when the checkpoint was written.
   * Null for session-level checkpoints (SESSION_INIT, SESSION_CLOSE).
   * Used by the resume flow to advance to exactly where the player left off
   * rather than replaying from the face hub.
   */
  checkpointNodeId: string | null
  /**
   * Set when the session transitions to 'abandoned' state.
   * Null for all other lifecycle states.
   */
  abandonedAt: string | null
  /** ISO 8601 record creation timestamp. */
  createdAt: string
  /** ISO 8601 record last-update timestamp. */
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------

/**
 * Serialises an OrientationMetaPacket to the compact JSON string stored in
 * `orientation_sessions.packetJson`.
 *
 * Always uses JSON.stringify with no pretty-printing — the stored blob is
 * machine-read only; human readability is not a goal here.
 */
export function serializePacket(packet: OrientationMetaPacket): string {
  return JSON.stringify(packet)
}

/**
 * Deserialises the JSON string from `orientation_sessions.packetJson` back to
 * an OrientationMetaPacket.
 *
 * Throws `SyntaxError` if the stored JSON is malformed.
 * Callers should catch this and surface a user-visible error rather than
 * silently returning an empty packet.
 */
export function deserializePacket(json: string): OrientationMetaPacket {
  return JSON.parse(json) as OrientationMetaPacket
}

// ---------------------------------------------------------------------------
// State-transition helpers — produce updated packet copies
// ---------------------------------------------------------------------------
// These helpers are pure functions; they do NOT write to the DB.
// The server-action layer calls them and then persists the result.
// Each returns a new packet with updatedAt refreshed.
// ---------------------------------------------------------------------------

/**
 * Returns a copy of `packet` with `activeFace` set to `face` and
 * the named face sub-packet transitioned from 'pending' → 'in_progress'.
 *
 * No-op (returns a shallow copy with updated timestamp) when the sub-packet
 * is already 'in_progress', 'complete', or 'skipped'.
 *
 * Guards against missing face keys when `enabledFaces` was a subset at
 * session init — returns `packet` unchanged if the face is not present.
 */
export function applyFaceEnter(
  packet: OrientationMetaPacket,
  face: GameMasterFace,
): OrientationMetaPacket {
  const subPacket = packet.faceSubPackets[face]
  if (!subPacket) return packet // face not enabled in this session

  const updatedSubPacket: FaceSubPacket =
    subPacket.state === 'pending'
      ? { ...subPacket, state: 'in_progress' as FaceSubPacketState }
      : subPacket

  return {
    ...packet,
    activeFace: face,
    faceSubPackets: {
      ...packet.faceSubPackets,
      [face]: updatedSubPacket,
    },
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Returns a copy of `packet` with the named face sub-packet payload
 * deep-merged with `patch`.
 *
 * Deep-merge rules:
 *   - Top-level scalar fields: `patch` wins over `existing`.
 *   - `bar_integration`: merged at the sub-field level (REGENT + DIPLOMAT
 *     both contribute; neither clobbers the other's keys).
 *   - `quest_usage`: merged at the sub-field level (REGENT owns top-level
 *     shape; SAGE owns dotted sub-paths — merge ensures both survive).
 *   - Array fields (`prompt_templates`, `compatible_lock_types`, etc.):
 *     replaced entirely by `patch` value when present (arrays are not
 *     element-merged; the caller supplies the complete new array).
 *   - `parent_move_id`: set once; ignored in patch if already present.
 *
 * Guards against missing face keys — returns `packet` unchanged if the
 * face is not present.
 */
export function applyPayloadPatch(
  packet: OrientationMetaPacket,
  face: GameMasterFace,
  patch: Partial<FaceSubPacketPayload>,
): OrientationMetaPacket {
  const subPacket = packet.faceSubPackets[face]
  if (!subPacket) return packet // face not enabled in this session

  const existing = subPacket.payload

  // Deep-merge bar_integration (REGENT primary, DIPLOMAT sub-field)
  const mergedBarIntegration =
    patch.bar_integration !== undefined
      ? { ...(existing.bar_integration ?? {}), ...patch.bar_integration }
      : existing.bar_integration

  // Deep-merge quest_usage (REGENT primary shape, SAGE sub-fields)
  const mergedQuestUsage =
    patch.quest_usage !== undefined
      ? { ...(existing.quest_usage ?? {}), ...patch.quest_usage }
      : existing.quest_usage

  // parent_move_id: never overwrite once set (remix lineage is immutable)
  const parentMoveId =
    existing.parent_move_id !== undefined
      ? existing.parent_move_id
      : patch.parent_move_id

  const mergedPayload: FaceSubPacketPayload = {
    ...existing,
    ...patch,
    bar_integration: mergedBarIntegration,
    quest_usage: mergedQuestUsage,
    parent_move_id: parentMoveId,
  }

  const updatedSubPacket: FaceSubPacket = {
    ...subPacket,
    payload: mergedPayload,
  }

  return {
    ...packet,
    faceSubPackets: {
      ...packet.faceSubPackets,
      [face]: updatedSubPacket,
    },
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Returns a copy of `packet` with the named face sub-packet transitioned
 * to 'complete', `questProposalId` set, and `submittedAt` stamped.
 * If at least one face is complete, `sessionState` advances to 'submitted'.
 *
 * Guards against missing face keys — returns `packet` unchanged if the
 * face is not present.
 */
export function applyFaceSubmit(
  packet: OrientationMetaPacket,
  face: GameMasterFace,
  questProposalId: string,
): OrientationMetaPacket {
  const subPacket = packet.faceSubPackets[face]
  if (!subPacket) return packet

  const now = new Date().toISOString()
  const updatedSubPacket: FaceSubPacket = {
    ...subPacket,
    state: 'complete' as FaceSubPacketState,
    questProposalId,
    submittedAt: now,
  }

  const updatedFaceSubPackets = {
    ...packet.faceSubPackets,
    [face]: updatedSubPacket,
  }

  // Promote sessionState to 'submitted' when at least one face is complete
  const anyComplete = Object.values(updatedFaceSubPackets).some(
    (sp) => sp.state === 'complete',
  )
  const newSessionState: OrientationMetaPacket['sessionState'] =
    packet.sessionState === 'closed'
      ? 'closed'
      : anyComplete
        ? 'submitted'
        : packet.sessionState

  return {
    ...packet,
    faceSubPackets: updatedFaceSubPackets,
    sessionState: newSessionState,
    updatedAt: now,
  }
}

/**
 * Returns a copy of `packet` with the named face sub-packet transitioned
 * to 'skipped'.
 *
 * Guards against missing face keys — returns `packet` unchanged if the
 * face is not present.
 */
export function applyFaceSkip(
  packet: OrientationMetaPacket,
  face: GameMasterFace,
): OrientationMetaPacket {
  const subPacket = packet.faceSubPackets[face]
  if (!subPacket) return packet

  const updatedSubPacket: FaceSubPacket = {
    ...subPacket,
    state: 'skipped' as FaceSubPacketState,
  }

  return {
    ...packet,
    faceSubPackets: {
      ...packet.faceSubPackets,
      [face]: updatedSubPacket,
    },
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Returns a copy of `packet` with `sessionState` set to 'closed' and
 * `activeFace` cleared.
 */
export function applySessionClose(
  packet: OrientationMetaPacket,
): OrientationMetaPacket {
  return {
    ...packet,
    sessionState: 'closed',
    activeFace: null,
    updatedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Checkpoint payload builder
// ---------------------------------------------------------------------------

/**
 * Builds the upsert payload for an orientation checkpoint write.
 *
 * Does not perform the DB write — the server-action layer calls this and
 * passes the result to `db.orientationSession.upsert()`.
 */
export function buildCheckpointPayload(
  packet: OrientationMetaPacket,
  checkpoint: CheckpointName,
): Omit<OrientationCheckpointRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date().toISOString()
  return {
    packetId: packet.packetId,
    playerId: packet.playerId,
    sessionState: packet.sessionState,
    submissionPath: packet.submissionPath,
    packetJson: serializePacket(packet),
    lastCheckpoint: checkpoint,
    checkpointAt: now,
  }
}
