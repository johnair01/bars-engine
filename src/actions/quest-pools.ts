'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * Quest Library Wave Routing — pool-based quest surfaces.
 * Spec: .specify/specs/quest-library-wave-routing/spec.md
 */

export type QuestPoolType = 'efa' | 'dojo' | 'discovery' | 'gameboard'

async function requireAdmin() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

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

/**
 * Get discovery pool quests (admin only). Wake Up quests awaiting review.
 */
export async function getDiscoveryQuests(): Promise<
  | { quests: QuestSummary[] }
  | { error: string }
> {
  try {
    await requireAdmin()

    const quests = await db.customBar.findMany({
      where: {
        questPool: 'discovery',
        status: 'active',
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
    const msg = e instanceof Error ? e.message : 'Failed to load discovery quests'
    return { error: msg }
  }
}

/**
 * Assign a quest to a pool (admin only). Used for reassignment from discovery queue.
 */
export async function assignQuestToPool(
  questId: string,
  pool: QuestPoolType
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()

    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) return { error: 'Quest not found' }
    if (quest.status !== 'active') return { error: 'Quest is not active' }

    await db.customBar.update({
      where: { id: questId },
      data: { questPool: pool },
    })

    revalidatePath('/admin/discovery')
    revalidatePath('/admin/books')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Assign failed'
    return { error: msg }
  }
}

/**
 * Reject (archive) a discovery quest (admin only).
 */
export async function rejectDiscoveryQuest(
  questId: string
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()

    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) return { error: 'Quest not found' }
    if (quest.questPool !== 'discovery') return { error: 'Quest is not in discovery pool' }

    await db.customBar.update({
      where: { id: questId },
      data: { status: 'archived' },
    })

    revalidatePath('/admin/discovery')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Reject failed'
    return { error: msg }
  }
}
