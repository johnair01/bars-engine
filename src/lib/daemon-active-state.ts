/**
 * Read active daemon channel/altitude for a player (most recent non-expired summon).
 * Pure DB — safe to import from @/lib without pulling in "use server" actions.
 * Spec: .specify/specs/individuation-engine/plan.md (IE-2 / IE-6)
 */

import { db } from '@/lib/db'

export async function queryActiveDaemonChannelAltitude(
  playerId: string
): Promise<{ channel: string | null; altitude: string | null } | null> {
  const now = new Date()
  const summon = await db.daemonSummon.findFirst({
    where: { playerId, status: 'active', expiresAt: { gt: now } },
    orderBy: { summonedAt: 'desc' },
    select: {
      daemon: { select: { channel: true, altitude: true } },
    },
  })
  if (!summon) return null
  return {
    channel: summon.daemon.channel ?? null,
    altitude: summon.daemon.altitude ?? null,
  }
}

/** Daemon id for the player's most recent active summon, if any. */
export async function queryActiveSummonedDaemonId(playerId: string): Promise<string | null> {
  const now = new Date()
  const summon = await db.daemonSummon.findFirst({
    where: { playerId, status: 'active', expiresAt: { gt: now } },
    orderBy: { summonedAt: 'desc' },
    select: { daemonId: true },
  })
  return summon?.daemonId ?? null
}
