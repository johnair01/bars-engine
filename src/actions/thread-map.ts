/**
 * Thread Map — fetch QuestThread sequence data for visualization.
 * Spec: .specify/specs/story-quest-map-exploration/spec.md (Map B)
 */

import { db } from '@/lib/db'

export type ThreadMapNode = {
  id: string
  questId: string
  position: number
  title: string
  moveType: string | null
  isCompleted: boolean
  isCurrent: boolean
}

export type ThreadMapData = {
  threadId: string
  threadTitle: string
  totalQuests: number
  currentPosition: number
  isComplete: boolean
  nodes: ThreadMapNode[]
}

/**
 * Fetch QuestThread + ThreadQuest (ordered) + ThreadProgress + PlayerQuest.
 */
export async function getThreadMapData(
  threadId: string,
  playerId: string | null
): Promise<ThreadMapData | null> {
  const thread = await db.questThread.findUnique({
    where: { id: threadId, status: 'active' },
    include: {
      quests: {
        orderBy: { position: 'asc' },
        include: { quest: true },
      },
      progress: true,
    },
  })

  if (!thread) return null

  const progress = playerId
    ? thread.progress.find((p) => p.playerId === playerId) ?? null
    : null
  const currentPosition = progress?.currentPosition ?? 0
  const isComplete = progress?.completedAt != null

  // Get PlayerQuest status for each quest (completed vs assigned)
  const completedQuestIds = new Set<string>()
  if (playerId) {
    const pqs = await db.playerQuest.findMany({
      where: {
        playerId,
        questId: { in: thread.quests.map((tq) => tq.questId) },
        status: 'completed',
      },
      select: { questId: true },
    })
    pqs.forEach((pq) => completedQuestIds.add(pq.questId))
  }

  const nodes: ThreadMapNode[] = thread.quests.map((tq) => {
    const completed = completedQuestIds.has(tq.questId)
    const isCurrent = tq.position === currentPosition && !isComplete
    return {
      id: tq.id,
      questId: tq.questId,
      position: tq.position,
      title: tq.quest?.title ?? 'Untitled',
      moveType: tq.quest?.moveType ?? null,
      isCompleted: completed,
      isCurrent,
    }
  })

  return {
    threadId: thread.id,
    threadTitle: thread.title,
    totalQuests: thread.quests.length,
    currentPosition,
    isComplete,
    nodes,
  }
}
