'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import { addBarToHandForPlayer } from '@/lib/hand-service'
import { revalidatePath } from 'next/cache'

const MOVE_BSM = mergeSeedMetabolization(null, {
  maturity: 'captured',
  soilKind: 'holding_pen',
})

export type UnpackCard = {
  title: string
  family: string
  face: string
  why: string
  element: string | null
}

export type SaveUnpackInput = {
  campaign: string
  goal: string
  domain: string
  hand: UnpackCard[]
}

export async function saveUnpackQuiz(
  input: SaveUnpackInput,
): Promise<{ success: true; barIds: string[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  if (input.hand.length === 0) return { error: 'No cards to save' }

  const barIds: string[] = []

  for (const card of input.hand.slice(0, 6)) {
    try {
      const bar = await db.customBar.create({
        data: {
          creatorId: player.id,
          title: card.title,
          description: card.why,
          type: 'move',
          reward: 0,
          visibility: 'private',
          status: 'active',
          inputs: '[]',
          rootId: 'temp',
          nation: card.element,
          moveType: card.face,
          seedMetabolization: MOVE_BSM,
        },
        select: { id: true },
      })
      await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
      barIds.push(bar.id)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown'
      console.error('[saveUnpackQuiz] create failed:', msg)
    }
  }

  for (const barId of barIds) {
    await addBarToHandForPlayer(player.id, barId)
  }

  revalidatePath('/')
  revalidatePath('/vault')

  return { success: true, barIds }
}
