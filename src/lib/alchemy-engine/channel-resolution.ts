/**
 * Alchemy Engine — Stabilized Channel Resolution
 *
 * Determines the emotional channel the player stabilized through during their arc.
 * The "stabilized channel" is the channel carried consistently through all 3 phases
 * (Intake → Action → Reflection). This channel becomes the type of the Reflection BAR.
 *
 * Resolution strategy (in priority order):
 *   1. Read prior arc BARs (intake + action) — if both share a channel, that's the stabilized one
 *   2. Read AlchemyPlayerState.channel — the channel set at arc start
 *   3. Fallback to 'Neutrality' if no state exists
 *
 * Why this module exists:
 *   The player's channel could theoretically drift between phases if a bug or
 *   external mutation changes their state. This module resolves the ACTUAL channel
 *   the player traveled through by checking the BAR artifacts, not just current state.
 *   BAR channel evidence > current state self-report (behavior over self-report).
 *
 * @see src/actions/alchemy-engine.ts — completeReflectionPhase uses this
 * @see src/lib/alchemy-engine/bar-production.ts — buildReflectionBarData accepts the resolved channel
 */

import { db } from '@/lib/db'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Channel mapping (DB lowercase → type title-case)
// ---------------------------------------------------------------------------

const CHANNEL_DB_TO_TYPE: Record<string, EmotionalChannel> = {
  fear: 'Fear',
  anger: 'Anger',
  sadness: 'Sadness',
  joy: 'Joy',
  neutrality: 'Neutrality',
}

const VALID_CHANNELS: EmotionalChannel[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']

// ---------------------------------------------------------------------------
// Pure resolution (no DB)
// ---------------------------------------------------------------------------

/**
 * Resolve the stabilized channel from available evidence.
 *
 * Pure function — takes pre-fetched data, returns the resolved channel.
 * This is the testable core of channel resolution.
 *
 * Priority:
 *   1. If intake + action BARs agree on a channel → that channel
 *   2. If only one BAR exists → its channel
 *   3. If player state has a channel → that channel
 *   4. Fallback → 'Neutrality'
 *
 * @param intakeChannel - Channel from the intake BAR's nation field (lowercase)
 * @param actionChannel - Channel from the action BAR's nation field (lowercase)
 * @param stateChannel  - Channel from AlchemyPlayerState (lowercase)
 */
export function resolveChannelFromEvidence(
  intakeChannel: string | null,
  actionChannel: string | null,
  stateChannel: string | null,
): EmotionalChannel {
  // Priority 1: Both BARs agree
  if (intakeChannel && actionChannel && intakeChannel === actionChannel) {
    return CHANNEL_DB_TO_TYPE[intakeChannel] ?? 'Neutrality'
  }

  // Priority 2: Intake BAR channel (it was set at arc start, most authoritative)
  if (intakeChannel) {
    return CHANNEL_DB_TO_TYPE[intakeChannel] ?? 'Neutrality'
  }

  // Priority 3: Action BAR channel
  if (actionChannel) {
    return CHANNEL_DB_TO_TYPE[actionChannel] ?? 'Neutrality'
  }

  // Priority 4: Current player state channel
  if (stateChannel) {
    return CHANNEL_DB_TO_TYPE[stateChannel] ?? 'Neutrality'
  }

  // Priority 5: Fallback
  return 'Neutrality'
}

/**
 * Validate that a resolved channel is a valid EmotionalChannel.
 */
export function isValidChannel(channel: string): channel is EmotionalChannel {
  return VALID_CHANNELS.includes(channel as EmotionalChannel)
}

// ---------------------------------------------------------------------------
// DB-backed resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the stabilized channel for a player's current arc.
 *
 * Queries the player's arc BARs and state to determine the consistent
 * emotional channel they traveled through. This channel types the Reflection BAR.
 *
 * @param playerId - The player whose stabilized channel to resolve
 * @returns The resolved EmotionalChannel (title-case)
 */
export async function resolveStabilizedChannel(
  playerId: string,
): Promise<EmotionalChannel> {
  // Read player state for arc metadata + channel
  const playerState = await db.alchemyPlayerState.findUnique({
    where: { playerId },
    select: {
      channel: true,
      arcStartedAt: true,
    },
  })

  const stateChannel = playerState?.channel ?? null
  const arcStartedAt = playerState?.arcStartedAt ?? new Date(0)

  // Read prior BARs from this arc to extract their channel evidence
  const arcBars = await db.customBar.findMany({
    where: {
      creatorId: playerId,
      type: { in: ['intake', 'action'] },
      createdAt: { gte: arcStartedAt },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      type: true,
      nation: true,
    },
  })

  const intakeChannel = arcBars.find((b) => b.type === 'intake')?.nation ?? null
  const actionChannel = arcBars.find((b) => b.type === 'action')?.nation ?? null

  return resolveChannelFromEvidence(intakeChannel, actionChannel, stateChannel)
}

/**
 * Resolve the stabilized channel from within a Prisma transaction.
 *
 * Same logic as resolveStabilizedChannel but uses the transaction client
 * for consistency within phase completion transactions.
 */
export async function resolveStabilizedChannelInTransaction(
  tx: any, // Prisma transaction client
  playerId: string,
  arcStartedAt: Date,
): Promise<EmotionalChannel> {
  const playerState = await tx.alchemyPlayerState.findUnique({
    where: { playerId },
    select: { channel: true },
  })

  const arcBars = await tx.customBar.findMany({
    where: {
      creatorId: playerId,
      type: { in: ['intake', 'action'] },
      createdAt: { gte: arcStartedAt },
    },
    orderBy: { createdAt: 'asc' },
    select: { type: true, nation: true },
  })

  const intakeChannel = arcBars.find((b: any) => b.type === 'intake')?.nation ?? null
  const actionChannel = arcBars.find((b: any) => b.type === 'action')?.nation ?? null

  return resolveChannelFromEvidence(intakeChannel, actionChannel, playerState?.channel ?? null)
}
