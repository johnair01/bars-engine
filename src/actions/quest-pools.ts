'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * Quest Library Wave Routing — pool-based quest surfaces.
 * Spec: .specify/specs/quest-library-wave-routing/spec.md
 */

export type QuestPoolType = 'efa' | 'dojo' | 'discovery' | 'gameboard'

export type QuestSummary = {
  id: string
  title: string
  description: string | null
  moveType: string | null
  allyshipDomain: string | null
  reward: number
}

/**
 * Get quests by pool. Returns library/system quests tagged for that pool.
 */
export async function getQuestsByPool(
  pool: QuestPoolType
): Promise<{ quests: QuestSummary[] } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const quests = await db.customBar.findMany({
      where: {
        questPool: pool,
        status: 'active',
        OR: [
          { isSystem: true },
          { completionEffects: { contains: '"source":"library"' } },
          { completionEffects: { contains: '"bookId"' } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        moveType: true,
        allyshipDomain: true,
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      quests: quests.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        moveType: q.moveType,
        allyshipDomain: q.allyshipDomain,
        reward: q.reward,
      })),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load quests'
    return { error: msg }
  }
}
