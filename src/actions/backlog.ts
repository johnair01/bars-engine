'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

export async function assignBacklogItemOwner(
  itemId: string,
  face: GameMasterFace | null
): Promise<{ success: boolean; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not logged in' }

  const adminRole = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
  })
  if (!adminRole) return { success: false, error: 'Admin access required' }

  await db.specKitBacklogItem.update({
    where: { id: itemId },
    data: { ownerFace: face },
  })

  revalidatePath('/admin/backlog')
  return { success: true }
}

export async function getBacklogItemsByOwner(face?: GameMasterFace | null) {
  const where = face ? { ownerFace: face } : {}
  return db.specKitBacklogItem.findMany({
    where,
    orderBy: [{ priority: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      priority: true,
      featureName: true,
      link: true,
      category: true,
      status: true,
      ownerFace: true,
    },
  })
}
