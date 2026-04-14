'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { startThread } from './quest-thread'

/**
 * Quest Library — book-derived quest threads.
 * Spec: .specify/specs/book-to-quest-library/spec.md
 */

export type QuestThreadSummary = {
  id: string
  title: string
  description: string | null
  questCount: number
  bookTitle?: string | null
  bookAuthor?: string | null
  moveTypes?: string[]
  hasProgress: boolean
  currentPosition?: number | null
  completedAt?: Date | null
  quests: Array<{ id: string; title: string; moveType?: string | null }>
}

/**
 * Get Quest Library content for the current player.
 * Returns threads where creatorType = 'library', filtered by player nation/archetype when gated.
 */
export async function getQuestLibraryContent(): Promise<QuestThreadSummary[]> {
  const player = await getCurrentPlayer()
  if (!player) return []

  const threads = await db.questThread.findMany({
    where: {
      status: 'active',
      creatorType: 'library',
      bookId: { not: null },
    },
    include: {
      book: true,
      quests: {
        orderBy: { position: 'asc' },
        include: { quest: true },
      },
      progress: {
        where: { playerId: player.id },
      },
    },
  })

  const playerNationId = player.nationId ?? null
  const playerArchetypeId = player.archetypeId ?? null

  const filtered = threads.filter((t) => {
    if (t.gateNationId && t.gateNationId !== playerNationId) return false
    if (t.gateArchetypeId && t.gateArchetypeId !== playerArchetypeId) return false
    return true
  })

  return filtered.map((t) => {
    const moveTypes = [...new Set(t.quests.map((q) => q.quest.moveType).filter(Boolean))] as string[]
    const progress = t.progress[0]
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      questCount: t.quests.length,
      bookTitle: t.book?.title ?? null,
      bookAuthor: t.book?.author ?? null,
      moveTypes: moveTypes.length > 0 ? moveTypes : undefined,
      hasProgress: t.progress.length > 0,
      currentPosition: progress?.currentPosition ?? null,
      completedAt: progress?.completedAt ?? null,
      quests: t.quests.map((q) => ({
        id: q.quest.id,
        title: q.quest.title,
        moveType: q.quest.moveType,
      })),
    }
  })
}

/**
 * Pull a thread from the library into the player's journey.
 * Creates ThreadProgress (starts the thread).
 */
export async function pullFromLibraryAction(
  input: { threadId?: string; questId?: string }
): Promise<
  | { success: true; threadProgressId?: string; playerQuestId?: string }
  | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  if (input.threadId) {
    const result = await startThread(input.threadId)
    if (result.error) return { error: result.error }
    revalidatePath('/')
    revalidatePath('/library')
    return { success: true }
  }

  if (input.questId) {
    const quest = await db.customBar.findUnique({
      where: { id: input.questId, status: 'active' },
    })
    if (!quest) return { error: 'Quest not found' }

    const existing = await db.playerQuest.findFirst({
      where: {
        playerId: player.id,
        questId: input.questId,
        status: { in: ['assigned', 'completed'] },
      },
    })
    if (existing) return { error: 'Quest already in your journey' }

    await db.playerQuest.create({
      data: {
        playerId: player.id,
        questId: input.questId,
        status: 'assigned',
      },
    })

    revalidatePath('/')
    revalidatePath('/library')
    return { success: true, playerQuestId: input.questId }
  }

  return { error: 'Provide threadId or questId' }
}
