'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'

export type AdventureProgress = {
  currentNodeId: string
  stateData: Record<string, unknown>
}

/**
 * Get saved progress for the current player in an adventure.
 * Returns null if no progress exists.
 */
export async function getAdventureProgress(
  adventureId: string
): Promise<AdventureProgress | null> {
  const player = await getCurrentPlayer()
  if (!player) return null

  const progress = await db.playerAdventureProgress.findUnique({
    where: {
      playerId_adventureId: { playerId: player.id, adventureId },
    },
  })

  if (!progress || !progress.currentNodeId) return null

  let stateData: Record<string, unknown> = {}
  try {
    stateData = JSON.parse(progress.stateData || '{}') as Record<string, unknown>
  } catch {
    /* ignore */
  }

  return {
    currentNodeId: progress.currentNodeId,
    stateData,
  }
}

/**
 * Save progress for the current player in an adventure.
 * Upserts PlayerAdventureProgress.
 */
export async function saveAdventureProgress(
  adventureId: string,
  currentNodeId: string,
  stateData: Record<string, unknown> = {}
): Promise<{ error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  await db.playerAdventureProgress.upsert({
    where: {
      playerId_adventureId: { playerId: player.id, adventureId },
    },
    create: {
      playerId: player.id,
      adventureId,
      currentNodeId,
      stateData: JSON.stringify(stateData),
    },
    update: {
      currentNodeId,
      stateData: JSON.stringify(stateData),
    },
  })

  return {}
}
