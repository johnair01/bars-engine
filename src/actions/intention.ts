'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * Update the player's intention (stored in storyProgress).
 * Used when player updates intention after orientation.
 */
export async function updatePlayerIntention(intention: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const trimmed = intention?.trim()
  if (!trimmed) return { error: 'Intention cannot be empty' }

  let storyProgress: Record<string, unknown> = {}
  try {
    if (player.storyProgress) {
      storyProgress = JSON.parse(player.storyProgress) as Record<string, unknown>
    }
  } catch {
    // Ignore parse errors; start fresh
  }

  storyProgress.intention = trimmed

  await db.player.update({
    where: { id: player.id },
    data: { storyProgress: JSON.stringify(storyProgress) },
  })

  revalidatePath('/')
  return { success: true }
}
