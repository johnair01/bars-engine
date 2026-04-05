/**
 * Vibeulon Map — fetch flow data for visualization.
 * Spec: .specify/specs/story-quest-map-exploration/spec.md (Map C)
 */

import { db } from '@/lib/db'

export type VibeulonMapRow = {
  id: string
  playerId: string
  playerName: string
  amount: number
  source: string
  forWhat: string
  questId: string | null
  archetypeMove: string | null
  createdAt: Date
}

export type VibeulonMapData = {
  rows: VibeulonMapRow[]
  totalEarned: number
  isAdmin: boolean
}

/** Time window in days; null = all time */
export type VibeulonTimeWindow = 7 | 30 | 90 | null

/**
 * Fetch VibulonEvent for time window; aggregate for display.
 * Admin: all players. Non-admin: own events only.
 */
export async function getVibeulonMapData(
  playerId: string | null,
  isAdmin: boolean,
  limit = 50,
  timeWindow: VibeulonTimeWindow = null
): Promise<VibeulonMapData | null> {
  if (!playerId) return null

  const since =
    timeWindow != null
      ? new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000)
      : undefined

  const where: { amount: { gt: number }; playerId?: string; createdAt?: { gte: Date } } = {
    amount: { gt: 0 },
  }
  if (!isAdmin) {
    where.playerId = playerId
  }
  if (since) {
    where.createdAt = { gte: since }
  }

  const events = await db.vibulonEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      player: { select: { id: true, name: true } },
    },
  })

  const questIds = [...new Set(events.map((e) => e.questId).filter(Boolean))] as string[]
  const quests =
    questIds.length > 0
      ? await db.customBar.findMany({
          where: { id: { in: questIds } },
          select: { id: true, title: true },
        })
      : []
  const questMap = Object.fromEntries(quests.map((q) => [q.id, q.title]))

  const rows: VibeulonMapRow[] = events.map((e) => ({
    id: e.id,
    playerId: e.playerId,
    playerName: e.player?.name || 'A player',
    amount: e.amount,
    source: e.source,
    forWhat:
      e.questId && questMap[e.questId]
        ? questMap[e.questId]
        : e.source === 'p2p_transfer'
          ? (e.notes?.replace(/^Received from /, '')?.split(' • ')[0] || 'transfer')
          : e.source === 'appreciation'
            ? (e.notes?.replace(/^Appreciation from /, '')?.split(' (')[0] || 'appreciation')
            : e.notes?.replace(/^Quest Completed: /, '')?.replace(/^Bonus from quest: /, '')?.split(' (')[0] || e.source,
    questId: e.questId,
    archetypeMove: e.archetypeMove,
    createdAt: e.createdAt,
  }))

  const totalEarned = rows.reduce((sum, r) => sum + r.amount, 0)

  return {
    rows,
    totalEarned,
    isAdmin,
  }
}
