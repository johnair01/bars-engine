'use server'
import { dbBase } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'
import { computeAgentPositions } from '@/lib/spatial-world/intent-agents'

export async function getIntentAgentsForRoom(roomId: string, tilemap: Record<string, unknown>) {
  const currentPlayerId = await requirePlayer()
  const presences = await dbBase.roomPresence.findMany({
    where: { roomId },
    include: { player: { select: { id: true, name: true, spriteUrl: true } } },
  })
  const records = presences.map(p => ({
    id: p.id,
    playerId: p.playerId,
    playerName: p.player.name,
    spriteUrl: p.player.spriteUrl,
    lastSeenAt: p.lastSeenAt,
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return computeAgentPositions(records, tilemap as any, currentPlayerId)
}

export async function getAgentBars(agentPlayerId: string) {
  const [bars, quests] = await Promise.all([
    dbBase.customBar.findMany({
      where: { creatorId: agentPlayerId, status: 'active', claimedById: null, visibility: 'public' },
      select: { id: true, title: true, description: true, type: true },
      take: 10,
    }),
    dbBase.customBar.findMany({
      where: { creatorId: agentPlayerId, type: 'quest', status: 'active' },
      select: { id: true, title: true, description: true },
      take: 10,
    }),
  ])
  return { bars, quests }
}
