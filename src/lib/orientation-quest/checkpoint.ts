'use client'

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

// ---------------------------------------------------------------------------
// Checkpoint payload builder
// ---------------------------------------------------------------------------

/**
 * Options bag for buildCheckpointPayload().
 */
export interface CheckpointPayloadOptions {
  /**
   * Quest node ID the player is currently at, if the checkpoint was triggered
   * from within a face sub-packet beat (FACE_ENTER, PAYLOAD_PATCH, FACE_SUBMIT).
   * Leave undefined for session-level checkpoints (SESSION_INIT, SESSION_CLOSE).
   */
  currentNodeId?: string
}

/**
 * Builds the upsert payload for an orientation checkpoint write.
 *
 * Does not perform the DB write — the server-action layer calls this and
 * passes the result to `db.orientationSession.upsert()`.
 *
 * @param packet      The current (post-transition) OrientationMetaPacket.
 * @param checkpoint  The named transition that triggered this write.
 * @param options     Optional — supply currentNodeId for fine-grained resume.
 */
export function buildCheckpointPayload(
  packet: OrientationMetaPacket,
  checkpoint: CheckpointName,
  options: CheckpointPayloadOptions = {},
): Omit<OrientationCheckpointRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date().toISOString()

  // SESSION_INIT and SESSION_CLOSE are session-level: nodeId is null
  const isSessionLevel =
    checkpoint === 'SESSION_INIT' || checkpoint === 'SESSION_CLOSE'
  const checkpointNodeId =
    isSessionLevel ? null : (options.currentNodeId ?? null)

  return {
    packetId: packet.packetId,
    playerId: packet.playerId,
    sessionState: packet.sessionState,
    submissionPath: packet.submissionPath,
    packetJson: serializePacket(packet),
    lastCheckpoint: checkpoint,
    checkpointAt: now,
    checkpointNodeId,
    abandonedAt: null, // never set by the player path; SLA fallback sets this separately
  }
}

// ---------------------------------------------------------------------------
// Abandonment detection
// ---------------------------------------------------------------------------

/**
 * Milliseconds of inactivity after which an active session is considered
 * abandoned. Default: 24 hours.
 *
 * Callers may supply a custom threshold to override (e.g. for testing or
 * configurable per-environment SLA windows).
 */
export const ABANDONMENT_THRESHOLD_MS: number = 24 * 60 * 60 * 1000

/**
 * Returns true when all of the following hold:
 *   1. `sessionState` is 'active' (not closed, submitted, or already abandoned).
 *   2. The elapsed time since `checkpointAt` exceeds `thresholdMs`.
 *
 * A session that is 'submitted' or 'closed' is considered complete, not
 * abandoned — callers should check those states separately.
 *
 * @param sessionState - Value from OrientationSession.sessionState.
 * @param checkpointAt - Value from OrientationSession.checkpointAt (Date or ISO string).
 * @param now          - Reference "current" time. Defaults to `new Date()`.
 *                       Override in tests to avoid wall-clock dependency.
 * @param thresholdMs  - Inactivity threshold in ms. Defaults to ABANDONMENT_THRESHOLD_MS.
 */
export function isSessionAbandoned(
  sessionState: string,
  checkpointAt: Date | string,
  now: Date = new Date(),
  thresholdMs: number = ABANDONMENT_THRESHOLD_MS,
): boolean {
  if (sessionState !== 'active') return false
  const lastActive = checkpointAt instanceof Date ? checkpointAt : new Date(checkpointAt)
  return now.getTime() - lastActive.getTime() > thresholdMs
}

/**
 * Returns the elapsed milliseconds since the last checkpoint write.
 *
 * Useful for displaying "last active N hours ago" in the admin UI or
 * computing percentage through the abandonment window.
 *
 * @param checkpointAt - Value from OrientationSession.checkpointAt.
 * @param now          - Reference "current" time. Defaults to `new Date()`.
 */
export function getSessionAgeMs(checkpointAt: Date | string, now: Date = new Date()): number {
  const lastActive = checkpointAt instanceof Date ? checkpointAt : new Date(checkpointAt)
  return now.getTime() - lastActive.getTime()
}

// ---------------------------------------------------------------------------
// Resume outcome types
// ---------------------------------------------------------------------------

/**
 * Outcome codes returned by classifySessionForResume() and
 * resumeOrientationSession().
 *
 * - resumed:          A live, resumable session was found. Caller should render
 *                     from checkpointNodeId with the restored packet.
 * - no_session:       No prior session record exists (or packet JSON is corrupt).
 *                     Caller should start a fresh session.
 * - already_complete: The most recent session was fully submitted or closed.
 *                     Caller may show a "start a new session" prompt.
 * - abandoned:        The session was either already marked abandoned (DB flag)
 *                     or has been inactive beyond the threshold.
 *                     Caller should offer to resume despite staleness or start fresh.
 * - fresh_start:      A session record exists but has no meaningful progress
 *                     (all sub-packets still pending). Better to reinitialise
 *                     rather than show a stale resume banner.
 */
export type ResumeOutcome =
  | 'resumed'
  | 'no_session'
  | 'already_complete'
  | 'abandoned'
  | 'fresh_start'

/**
 * Full result of attempting to resume an orientation session.
 *
 * When `outcome === 'resumed'`:
 *   - `packet`           — the deserialized OrientationMetaPacket to restore.
 *   - `checkpointNodeId` — the quest node to render first (DB-recorded or derived).
 *   - `resumeBanner`     — player-facing context text.
 *   - `sessionId`        — DB row ID for subsequent saveOrientationCheckpoint() calls.
 *   - `resumeLabel`      — short label for the resume UI button.
 *
 * Other outcomes may populate `sessionId` only (for follow-up DB operations
 * such as markSessionAbandoned).
 */
export interface OrientationResumeResult {
  outcome: ResumeOutcome
  /** Deserialized meta-packet, present when outcome === 'resumed'. */
  packet?: OrientationMetaPacket
  /** Quest node ID to render on resume. */
  checkpointNodeId?: string
  /** Player-facing banner shown at the top of the resumed quest. */
  resumeBanner?: string
  /** Short label for the resume UI action button. */
  resumeLabel?: string
  /** DB row ID of the OrientationSession being resumed (or acted upon). */
  sessionId?: string
}

// ---------------------------------------------------------------------------
// Progress inspection
// ---------------------------------------------------------------------------

/**
 * Returns true when the packet has at least one face sub-packet that is
 * `in_progress` or `complete`. Sessions with all faces `pending` have no
 * meaningful content to resume — callers should treat them as `fresh_start`.
 *
 * Guards against missing face keys when `enabledFaces` was a subset at
 * session init (coordinator warning: faceSubPackets may not contain all 6 faces).
 */
export function hasResumableProgress(packet: OrientationMetaPacket): boolean {
  return Object.values(packet.faceSubPackets).some(
    (sp) => sp.state === 'in_progress' || sp.state === 'complete',
  )
}

/**
 * Returns a breakdown of how many sub-packets are in each state.
 *
 * Guards against missing face keys — only iterates over keys actually
 * present in `faceSubPackets` (which may be fewer than 6 for subset sessions).
 */
export function getPacketProgress(packet: OrientationMetaPacket): {
  completed: number
  inProgress: number
  skipped: number
  pending: number
  total: number
} {
  const counts = { completed: 0, inProgress: 0, skipped: 0, pending: 0, total: 0 }
  for (const sp of Object.values(packet.faceSubPackets)) {
    counts.total++
    if (sp.state === 'complete') counts.completed++
    else if (sp.state === 'in_progress') counts.inProgress++
    else if (sp.state === 'skipped') counts.skipped++
    else counts.pending++
  }
  return counts
}

// ---------------------------------------------------------------------------
// Resume node derivation
// ---------------------------------------------------------------------------

/**
 * Derive the quest node ID to render when the player resumes a session,
 * falling back through a priority chain when no DB-recorded node is available.
 *
 * Priority order:
 *   1. `activeFace` is non-null and its sub-packet is `in_progress`
 *      → resume at that face's entry node (`orient_<face>_<face>_intro`)
 *   2. Any sub-packet is `in_progress` (activeFace was null or stale)
 *      → resume at that face's entry node
 *   3. At least one sub-packet is `pending` (no in-progress face)
 *      → resume at the face selection hub (`orient_face_hub`)
 *   4. All sub-packets are complete or skipped
 *      → resume at the shared terminal (`orient_terminal`)
 *
 * Note: This derives the *face entry* node rather than an intra-face node
 * because the packet state does not track per-node position within a face path.
 * When a DB-recorded `checkpointNodeId` exists, callers should prefer it over
 * the result of this function — the DB value is more precise.
 *
 * @param packet - Deserialized OrientationMetaPacket.
 */
export function deriveResumeNodeId(packet: OrientationMetaPacket): string {
  const subPackets = packet.faceSubPackets

  // Priority 1: activeFace in_progress
  if (packet.activeFace !== null && packet.activeFace !== undefined) {
    const activeSub = subPackets[packet.activeFace]
    if (activeSub && activeSub.state === 'in_progress') {
      return `orient_${packet.activeFace}_${packet.activeFace}_intro`
    }
  }

  // Priority 2: any in_progress face (regardless of activeFace)
  const allFaces = Object.keys(subPackets) as GameMasterFace[]
  const inProgressFace = allFaces.find((f) => subPackets[f].state === 'in_progress')
  if (inProgressFace) {
    return `orient_${inProgressFace}_${inProgressFace}_intro`
  }

  // Priority 3: any pending face → face hub
  const hasPending = allFaces.some((f) => subPackets[f].state === 'pending')
  if (hasPending) {
    return 'orient_face_hub'
  }

  // Priority 4: all done → terminal
  return 'orient_terminal'
}

// ---------------------------------------------------------------------------
// Resume banner
// ---------------------------------------------------------------------------

/**
 * Build a player-facing context message shown when the session resumes.
 *
 * Examples:
 *   "Welcome back — you are partway through the Shaman path. Pick up where you left off."
 *   "Welcome back — you have completed 3 of 6 faces. Continue from where you left off."
 *   "Welcome back — you have not started any face yet. Choose your first face to begin."
 *
 * @param packet - Deserialized OrientationMetaPacket.
 */
export function buildResumeBanner(packet: OrientationMetaPacket): string {
  const { completed, inProgress, total } = getPacketProgress(packet)

  if (inProgress > 0 && packet.activeFace) {
    const name = packet.activeFace.charAt(0).toUpperCase() + packet.activeFace.slice(1)
    return `Welcome back — you are partway through the ${name} path. Pick up where you left off.`
  }
  if (completed > 0) {
    const plural = completed === 1 ? 'face' : 'faces'
    return `Welcome back — you have completed ${completed} of ${total} ${plural}. Continue from where you left off.`
  }
  return 'Welcome back — you have not started any face yet. Choose your first face to begin.'
}

/**
 * Build the short label for the resume UI action button.
 *
 * Examples:
 *   "Continue Shaman path"
 *   "Continue (3 / 6 complete)"
 *   "Choose a face"
 *
 * @param packet - Deserialized OrientationMetaPacket.
 */
export function buildResumeLabel(packet: OrientationMetaPacket): string {
  const { completed, inProgress, total } = getPacketProgress(packet)

  if (inProgress > 0 && packet.activeFace) {
    const name = packet.activeFace.charAt(0).toUpperCase() + packet.activeFace.slice(1)
    return `Continue ${name} path`
  }
  if (completed > 0) {
    return `Continue (${completed} / ${total} complete)`
  }
  return 'Choose a face'
}

// ---------------------------------------------------------------------------
// Session classification
// ---------------------------------------------------------------------------

/**
 * Classify a raw OrientationSession DB row for resume eligibility.
 *
 * This is the authoritative pure function for the resume decision tree.
 * It accepts the minimal DB row fields needed to make the classification
 * without any additional DB queries.
 *
 * The caller (server action) retrieves the DB row and passes it here;
 * this function handles all classification logic and returns the result.
 *
 * @param row          - Minimal DB row from orientation_sessions.
 * @param now          - Reference "current" time for abandonment check.
 * @param thresholdMs  - Abandonment threshold override.
 */
export function classifySessionForResume(
  row: {
    id: string
    sessionState: string
    checkpointAt: Date
    packetJson: string
    checkpointNodeId: string | null
    abandonedAt: Date | null
  },
  now: Date = new Date(),
  thresholdMs: number = ABANDONMENT_THRESHOLD_MS,
): OrientationResumeResult {
  const { id, sessionState, checkpointAt, packetJson, checkpointNodeId, abandonedAt } = row

  // Already explicitly abandoned (DB flag)
  if (sessionState === 'abandoned' || abandonedAt !== null) {
    return { outcome: 'abandoned', sessionId: id }
  }

  // Already complete / closed
  if (sessionState === 'submitted' || sessionState === 'closed') {
    return { outcome: 'already_complete', sessionId: id }
  }

  // Active session — check time-based abandonment
  if (isSessionAbandoned(sessionState, checkpointAt, now, thresholdMs)) {
    return { outcome: 'abandoned', sessionId: id }
  }

  // Deserialise packet — treat corrupt JSON as no_session
  let packet: OrientationMetaPacket
  try {
    packet = deserializePacket(packetJson)
  } catch {
    return { outcome: 'no_session' }
  }

  // No meaningful progress → fresh_start (don't show a stale resume banner)
  if (!hasResumableProgress(packet)) {
    return { outcome: 'fresh_start', sessionId: id }
  }

  // Derive resume position: DB-recorded node takes priority over derived node
  const derivedNodeId = deriveResumeNodeId(packet)
  const resumeNodeId = checkpointNodeId ?? derivedNodeId

  return {
    outcome: 'resumed',
    packet,
    checkpointNodeId: resumeNodeId,
    resumeBanner: buildResumeBanner(packet),
    resumeLabel: buildResumeLabel(packet),
    sessionId: id,
  }
}
