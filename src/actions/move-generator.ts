'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import { revalidatePath } from 'next/cache'

export type CardWorkPayload = {
  barId: string
  intensity: number
  blockText: string
  blockTypes: string[]
  emoLayers: string[]
  moveKey: string
  moveTitle: string
  steps: Record<string, string>
}

export async function markMoveReady(
  payload: CardWorkPayload,
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const bar = await db.customBar.findFirst({
    where: { id: payload.barId, creatorId: player.id, status: 'active' },
    select: { id: true, seedMetabolization: true },
  })
  if (!bar) return { error: 'BAR not found' }

  const newBsm = mergeSeedMetabolization(bar.seedMetabolization, {
    maturity: 'context_named',
  })

  await db.customBar.update({
    where: { id: bar.id },
    data: {
      seedMetabolization: newBsm,
      storyContent: JSON.stringify({
        intensity: payload.intensity,
        blockText: payload.blockText,
        blockTypes: payload.blockTypes,
        emoLayers: payload.emoLayers,
        moveKey: payload.moveKey,
        moveTitle: payload.moveTitle,
        steps: payload.steps,
      }),
    },
  })

  revalidatePath('/')
  return { success: true }
}
