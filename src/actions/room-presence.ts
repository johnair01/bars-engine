'use server'
import { dbBase } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'

export async function enterRoom(roomId: string, instanceSlug: string) {
  const playerId = await requirePlayer()
  await dbBase.roomPresence.upsert({
    where: { playerId_roomId: { playerId, roomId } },
    update: { lastSeenAt: new Date(), instanceSlug },
    create: { playerId, roomId, instanceSlug, enteredAt: new Date(), lastSeenAt: new Date() },
  })
}

export async function heartbeat(roomId: string) {
  const playerId = await requirePlayer()
  await dbBase.roomPresence.updateMany({
    where: { playerId, roomId },
    data: { lastSeenAt: new Date() },
  })
}

export async function getRoomPresences(roomId: string) {
  return dbBase.roomPresence.findMany({
    where: { roomId },
    include: {
      player: { select: { id: true, name: true, spriteUrl: true } }
    },
    orderBy: { lastSeenAt: 'desc' },
  })
}
