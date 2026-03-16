'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'

async function getPlayerId() {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

export async function requestGameFork(instanceId: string) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const existing = await db.instanceExportRequest.findFirst({
    where: { instanceId, requestedByPlayerId: playerId, status: 'pending' },
  })
  if (existing) return { error: 'You already have a pending fork request for this instance.' }

  const req = await db.instanceExportRequest.create({
    data: { instanceId, requestedByPlayerId: playerId },
  })
  return { success: true, requestId: req.id }
}
