'use server'
import { dbBase } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'
import { parseAvatarConfig, slugifyName } from '@/lib/avatar-utils'
import { getElementForNationKey } from '@/lib/ui/nation-element'
import type { ElementKey } from '@/lib/ui/card-tokens'
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

/** For Register 3 panels: avatar + element ring from resolved nation (lobby intent agents, trade UI). */
export async function getPlayerAvatarPreview(playerId: string): Promise<{
  avatarConfig: string | null
  element: ElementKey | null
} | null> {
  await requirePlayer()
  const p = await dbBase.player.findUnique({
    where: { id: playerId },
    select: { avatarConfig: true, nation: { select: { name: true } } },
  })
  if (!p) return null
  const parsed = parseAvatarConfig(p.avatarConfig ?? null)
  const nationKey =
    (parsed?.nationKey?.trim() || (p.nation?.name ? slugifyName(p.nation.name) : '')) || ''
  const element = nationKey ? getElementForNationKey(nationKey) : null
  return { avatarConfig: p.avatarConfig ?? null, element }
}
