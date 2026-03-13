'use server'

/**
 * Orientation Quest — Checkpoint Server Actions
 *
 * DB-backed save / load / resume / abandon actions for the orientation quest
 * session lifecycle. These actions operate on the `orientation_sessions` table
 * (Prisma model: OrientationSession).
 *
 * Separation of concerns:
 *   - Pure logic (abandonment detection, resume classification, state transitions)
 *     lives in `src/lib/orientation-quest/checkpoint.ts`.
 *   - DB I/O lives here (this file). Import the pure helpers and combine with
 *     Prisma calls.
 *
 * Auth model:
 *   - Player-facing actions (save, load, resume, abandon) require a logged-in player.
 *   - Admin-facing actions (listAbandonedSessions) require an admin role.
 *
 * @see src/lib/orientation-quest/checkpoint.ts — pure logic layer
 * @see prisma/schema.prisma — OrientationSession model
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  buildCheckpointPayload,
  classifySessionForResume,
  ABANDONMENT_THRESHOLD_MS,
  type CheckpointName,
  type CheckpointPayloadOptions,
  type OrientationResumeResult,
} from '@/lib/orientation-quest/checkpoint'
import type { OrientationMetaPacket } from '@/lib/orientation-quest/types'

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function requirePlayer(): Promise<string> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')
  return player.id
}

async function requireAdmin(): Promise<string> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return player.id
}

// ---------------------------------------------------------------------------
// saveOrientationCheckpoint
// ---------------------------------------------------------------------------

/**
 * Upsert the current OrientationMetaPacket state to `orientation_sessions`.
 *
 * - INSERT on first call (packetId not yet in DB).
 * - UPDATE on subsequent calls (packetId already exists).
 *
 * @param packet     - Current state of the meta-packet (post-transition).
 * @param checkpoint - Named checkpoint event that triggered this write.
 * @param options    - Optional: supply `currentNodeId` for fine-grained resume.
 * @returns          - The DB row id of the upserted record.
 */
export async function saveOrientationCheckpoint(
  packet: OrientationMetaPacket,
  checkpoint: CheckpointName,
  options: CheckpointPayloadOptions & { playerIdOverride?: string } = {},
): Promise<{ sessionId: string }> {
  const { playerIdOverride, ...payloadOptions } = options
  const playerId = playerIdOverride ?? (await requirePlayer())

  // Verify the packet belongs to the authenticated player
  if (packet.playerId !== playerId) {
    throw new Error('Packet playerId does not match authenticated player')
  }

  const payload = buildCheckpointPayload(packet, checkpoint, payloadOptions)

  const record = await db.orientationSession.upsert({
    where: { packetId: packet.packetId },
    create: {
      packetId: payload.packetId,
      playerId: payload.playerId,
      sessionState: payload.sessionState,
      submissionPath: payload.submissionPath,
      packetJson: payload.packetJson,
      lastCheckpoint: payload.lastCheckpoint,
      checkpointAt: new Date(payload.checkpointAt),
      checkpointNodeId: payload.checkpointNodeId ?? null,
      abandonedAt: null,
    },
    update: {
      sessionState: payload.sessionState,
      submissionPath: payload.submissionPath,
      packetJson: payload.packetJson,
      lastCheckpoint: payload.lastCheckpoint,
      checkpointAt: new Date(payload.checkpointAt),
      checkpointNodeId: payload.checkpointNodeId ?? null,
      // abandonedAt is never cleared by this action — only markSessionAbandoned sets it
    },
    select: { id: true },
  })

  return { sessionId: record.id }
}

// ---------------------------------------------------------------------------
// loadOrientationCheckpoint
// ---------------------------------------------------------------------------

/**
 * Load the most-recent orientation session record for the authenticated player.
 *
 * Returns `null` when no record exists.
 *
 * Ordering: `checkpointAt DESC` so the caller always gets the newest session
 * if a player somehow has multiple records (e.g. from a partial rollback).
 *
 * @param playerIdOverride - Override for server-to-server calls (skips cookie auth).
 */
export async function loadOrientationCheckpoint(
  playerIdOverride?: string,
): Promise<{
  id: string
  packetId: string
  sessionState: string
  submissionPath: string
  packetJson: string
  lastCheckpoint: string
  checkpointAt: Date
  checkpointNodeId: string | null
  abandonedAt: Date | null
  createdAt: Date
  updatedAt: Date
} | null> {
  const playerId = playerIdOverride ?? (await requirePlayer())

  return db.orientationSession.findFirst({
    where: { playerId },
    orderBy: { checkpointAt: 'desc' },
  })
}

// ---------------------------------------------------------------------------
// markSessionAbandoned
// ---------------------------------------------------------------------------

/**
 * Transition an active session to the 'abandoned' state.
 *
 * Sets both `sessionState = 'abandoned'` and `abandonedAt = now`.
 *
 * Two callers:
 *   1. SLA-fallback job: passes `playerIdOverride` to bypass cookie auth.
 *   2. Player: clicks "Discard session" in the UI — uses cookie auth.
 *
 * No-op when the session is already abandoned, submitted, or closed.
 *
 * @param packetId         - OrientationMetaPacket.packetId of the session to abandon.
 * @param playerIdOverride - Override for server-to-server / SLA-fallback calls.
 */
export async function markSessionAbandoned(
  packetId: string,
  playerIdOverride?: string,
): Promise<{ success: boolean; alreadyTerminal: boolean }> {
  const playerId = playerIdOverride ?? (await requirePlayer())

  const session = await db.orientationSession.findUnique({
    where: { packetId },
    select: { id: true, playerId: true, sessionState: true },
  })

  if (!session) {
    return { success: false, alreadyTerminal: false }
  }

  // Ownership check — players may only abandon their own sessions
  if (session.playerId !== playerId) {
    throw new Error('Cannot abandon a session belonging to another player')
  }

  // Already in a terminal state — no-op
  if (
    session.sessionState === 'abandoned' ||
    session.sessionState === 'submitted' ||
    session.sessionState === 'closed'
  ) {
    return { success: true, alreadyTerminal: true }
  }

  await db.orientationSession.update({
    where: { id: session.id },
    data: {
      sessionState: 'abandoned',
      abandonedAt: new Date(),
    },
  })

  return { success: true, alreadyTerminal: false }
}

// ---------------------------------------------------------------------------
// resumeOrientationSession
// ---------------------------------------------------------------------------

/**
 * Full resume flow: load the most-recent session, classify it, and return
 * an OrientationResumeResult.
 *
 * This is the single entry point for the player UI when navigating to the
 * orientation quest route. The caller uses the `outcome` field to decide
 * whether to render a resume prompt, start fresh, or show a completion banner.
 *
 * Outcome mapping:
 *   - 'no_session'       → No record found; caller initialises a new session.
 *   - 'fresh_start'      → Record exists but no progress; caller may reuse it
 *                          or discard and create a new packet.
 *   - 'resumed'          → Restore `packet` and navigate to `checkpointNodeId`.
 *   - 'already_complete' → Show "start a new session?" prompt.
 *   - 'abandoned'        → Offer "continue anyway?" or "start fresh?" choice.
 *
 * Side-effect: when the classification detects time-based abandonment
 * (the session is active but past the threshold), this action writes the
 * `abandonedAt` flag to the DB so subsequent calls return outcome='abandoned'
 * without re-computing the time delta.
 *
 * @param playerIdOverride - Override for server-to-server calls.
 * @param thresholdMs      - Abandonment threshold override (default 24 h).
 */
export async function resumeOrientationSession(
  playerIdOverride?: string,
  thresholdMs: number = ABANDONMENT_THRESHOLD_MS,
): Promise<OrientationResumeResult> {
  const playerId = playerIdOverride ?? (await requirePlayer())

  const row = await db.orientationSession.findFirst({
    where: { playerId },
    orderBy: { checkpointAt: 'desc' },
    select: {
      id: true,
      sessionState: true,
      checkpointAt: true,
      packetJson: true,
      checkpointNodeId: true,
      abandonedAt: true,
    },
  })

  if (!row) {
    return { outcome: 'no_session' }
  }

  const now = new Date()
  const result = classifySessionForResume(row, now, thresholdMs)

  // Side-effect: persist abandonment flag when time-based detection fires
  // so subsequent calls return outcome='abandoned' without re-computing the delta.
  if (
    result.outcome === 'abandoned' &&
    row.sessionState === 'active' &&
    row.abandonedAt === null
  ) {
    await db.orientationSession.update({
      where: { id: row.id },
      data: {
        sessionState: 'abandoned',
        abandonedAt: now,
      },
    })
  }

  return result
}

// ---------------------------------------------------------------------------
// ADMIN: listAbandonedSessions
// ---------------------------------------------------------------------------

/**
 * Returns all orientation sessions with `sessionState = 'abandoned'`,
 * ordered by `abandonedAt` descending (most-recently abandoned first).
 *
 * Admin-only. Used by the admin UI to surface sessions that may need
 * SLA-fallback processing (challenger.py autonomous proposal generation).
 *
 * @param limit - Max rows to return (default 50).
 */
export async function listAbandonedSessions(limit = 50) {
  await requireAdmin()

  return db.orientationSession.findMany({
    where: { sessionState: 'abandoned' },
    orderBy: { abandonedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      packetId: true,
      playerId: true,
      submissionPath: true,
      lastCheckpoint: true,
      checkpointAt: true,
      abandonedAt: true,
      createdAt: true,
      player: { select: { id: true, name: true } },
    },
  })
}

// ---------------------------------------------------------------------------
// ADMIN: detectAndMarkAbandonedSessions
// ---------------------------------------------------------------------------

/**
 * Core DB sweep — no auth. Called by the server action (after requireAdmin)
 * and by the cron API route (after CRON_SECRET verification).
 *
 * @internal
 */
export async function _detectAndMarkAbandonedSessionsCore(
  thresholdMs: number = ABANDONMENT_THRESHOLD_MS,
): Promise<{ markedCount: number }> {
  const cutoff = new Date(Date.now() - thresholdMs)

  const result = await db.orientationSession.updateMany({
    where: {
      sessionState: 'active',
      abandonedAt: null,
      checkpointAt: { lt: cutoff },
    },
    data: {
      sessionState: 'abandoned',
      abandonedAt: new Date(),
    },
  })

  revalidatePath('/admin/orientation-sessions')

  return { markedCount: result.count }
}

/**
 * Admin-triggered sweep (server action). Requires an authenticated admin.
 * For cron-triggered sweeps use the API route at
 * `/api/cron/abandon-sessions` which verifies `CRON_SECRET` instead.
 *
 * @param thresholdMs - Abandonment threshold override (default 24 h).
 */
export async function detectAndMarkAbandonedSessions(
  thresholdMs: number = ABANDONMENT_THRESHOLD_MS,
): Promise<{ markedCount: number }> {
  await requireAdmin()
  return _detectAndMarkAbandonedSessionsCore(thresholdMs)
}
