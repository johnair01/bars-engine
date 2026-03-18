'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { FRICTION_TYPES, type FrictionType } from '@/lib/friction-types'

function isValidFrictionType(value: string): value is FrictionType {
  return FRICTION_TYPES.includes(value as FrictionType)
}

/**
 * Record friction when a player says "I'm stuck" on a quest.
 * Updates PlayerQuest with frictionType and frictionRecordedAt.
 */
export async function recordQuestFriction(
  questId: string,
  frictionType: FrictionType
): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    if (!isValidFrictionType(frictionType)) {
      return { error: `Invalid friction type. Must be one of: ${FRICTION_TYPES.join(', ')}` }
    }

    const updated = await db.playerQuest.updateMany({
      where: {
        playerId: player.id,
        questId,
      },
      data: {
        frictionType,
        frictionRecordedAt: new Date(),
      },
    })

    if (updated.count === 0) {
      return { error: 'Quest not found or not assigned to you' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record friction'
    return { error: message }
  }
}
