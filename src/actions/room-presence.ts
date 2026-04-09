'use server'
import { dbBase } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'

/** No @@unique([playerId, roomId]) on RoomPresence — cannot use upsert where playerId_roomId. */
export async function enterRoom(roomId: string, instanceSlug: string) {
  const playerId = await requirePlayer()
  const now = new Date()
  const existing = await dbBase.roomPresence.findFirst({
    where: { playerId, roomId },
    orderBy: { lastSeenAt: 'desc' },
    select: { id: true },
  })
  if (existing) {
    await dbBase.roomPresence.update({
      where: { id: existing.id },
      data: { lastSeenAt: now, instanceSlug },
    })
  } else {
    await dbBase.roomPresence.create({
      data: { playerId, roomId, instanceSlug, enteredAt: now, lastSeenAt: now },
    })
  }
}

export async function heartbeat(roomId: string) {
  let playerId: string
  try {
    playerId = await requirePlayer()
  } catch {
    return // Session expired — heartbeat is non-critical, fail silently
  }
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
