'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
const MOVE_ORDER = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
const ALLYSHIP_DOMAINS = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'] as const
const GAME_MASTER_FACES = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const

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

/**
 * Get draft quests for a book (status: draft, completionEffects contains bookId).
 */
export async function getBookDraftQuests(bookId: string) {
  await requireAdmin()

  const book = await db.book.findUnique({ where: { id: bookId } })
  if (!book) return { error: 'Book not found', quests: null }

  const quests = await db.customBar.findMany({
    where: {
      completionEffects: { contains: `"bookId":"${bookId}"` },
      status: 'draft',
    },
    orderBy: { createdAt: 'asc' },
  })

  return { book, quests }
}

/**
 * Get approved quests for a book (status: active).
 */
export async function getBookApprovedQuests(bookId: string) {
  await requireAdmin()

  const quests = await db.customBar.findMany({
    where: {
      completionEffects: { contains: `"bookId":"${bookId}"` },
      status: 'active',
    },
    orderBy: { createdAt: 'asc' },
  })

  return { quests }
}

/**
 * Approve a draft quest (status → active).
 */
export async function approveQuest(questId: string) {
  try {
    await requireAdmin()

    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) return { error: 'Quest not found' }
    if (quest.status !== 'draft') return { error: 'Quest is not in draft status' }

    await db.customBar.update({
      where: { id: questId },
      data: { status: 'active' },
    })

    revalidatePath('/admin/books')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Approve failed'
    return { error: msg }
  }
}

/**
 * Reject a draft quest (status → archived).
 */
export async function rejectQuest(questId: string) {
  try {
    await requireAdmin()

    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) return { error: 'Quest not found' }
    if (quest.status !== 'draft') return { error: 'Quest is not in draft status' }

    await db.customBar.update({
      where: { id: questId },
      data: { status: 'archived' },
    })

    revalidatePath('/admin/books')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Reject failed'
    return { error: msg }
  }
}

/**
 * Move approved (active) quests back to draft for review.
 * Use when quests were created before the draft/review feature (pre-approved).
 */
export async function moveApprovedToDraft(bookId: string) {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) return { error: 'Book not found' }

    const result = await db.customBar.updateMany({
      where: {
        completionEffects: { contains: `"bookId":"${bookId}"` },
        status: 'active',
      },
      data: { status: 'draft' },
    })

    revalidatePath('/admin/books')
    return { success: true, count: result.count }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Move to draft failed'
    return { error: msg }
  }
}

/**
 * Approve all draft quests for a book.
 */
export async function approveAllQuests(bookId: string) {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) return { error: 'Book not found' }

    const result = await db.customBar.updateMany({
      where: {
        completionEffects: { contains: `"bookId":"${bookId}"` },
        status: 'draft',
      },
      data: { status: 'active' },
    })

    revalidatePath('/admin/books')
    return { success: true, count: result.count }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Approve all failed'
    return { error: msg }
  }
}

export type UpdateBookQuestData = {
  title?: string
  description?: string
  moveType?: (typeof MOVE_TYPES)[number]
  allyshipDomain?: (typeof ALLYSHIP_DOMAINS)[number] | null
  reward?: number
  gameMasterFace?: (typeof GAME_MASTER_FACES)[number] | null
}

/**
 * Update a draft quest's title, description, moveType, allyshipDomain, reward, gameMasterFace.
 */
export async function updateBookQuest(questId: string, data: UpdateBookQuestData) {
  try {
    await requireAdmin()

    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) return { error: 'Quest not found' }
    if (quest.status !== 'draft') return { error: 'Only draft quests can be edited' }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.moveType !== undefined) updateData.moveType = data.moveType
    if (data.allyshipDomain !== undefined) updateData.allyshipDomain = data.allyshipDomain
    if (data.reward !== undefined) updateData.reward = Math.max(0, Math.min(99, data.reward))
    if (data.gameMasterFace !== undefined) updateData.gameMasterFace = data.gameMasterFace

    await db.customBar.update({
      where: { id: questId },
      data: updateData,
    })

    revalidatePath('/admin/books')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Update failed'
    return { error: msg }
  }
}

/**
 * Create a new QuestThread from a single quest. Admin can add more quests via journeys admin.
 */
export async function createThreadFromQuest(questId: string) {
  try {
    await requireAdmin()

    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) return { error: 'Quest not found' }

    const thread = await db.questThread.create({
      data: {
        title: `${quest.title} Thread`,
        description: `Thread started from quest: ${quest.title}`,
        threadType: 'standard',
        creatorType: 'admin',
        status: 'active',
      },
    })

    await db.threadQuest.create({
      data: {
        threadId: thread.id,
        questId: quest.id,
        position: 1,
      },
    })

    revalidatePath('/admin/books')
    revalidatePath('/admin/journeys')
    return { success: true, threadId: thread.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Create thread failed'
    return { error: msg }
  }
}

export type TwineExportQuest = {
  id: string
  title: string
  description: string
  moveType: string | null
  allyshipDomain: string | null
  gameMasterFace: string | null
  reward: number
  position: number
}

export type TwineExportData = {
  book: { id: string; title: string; author: string | null }
  quests: TwineExportQuest[]
}

/**
 * Export approved book quests for Twine adventure building.
 * Returns structured JSON with quest order from thread (if published) or move order.
 */
export async function getBookQuestsForTwineExport(bookId: string): Promise<{ error: string } | TwineExportData> {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({
      where: { id: bookId },
      include: { thread: { include: { quests: { orderBy: { position: 'asc' } } } } },
    })
    if (!book) return { error: 'Book not found' }

    const quests = await db.customBar.findMany({
      where: {
        completionEffects: { contains: `"bookId":"${bookId}"` },
        status: 'active',
      },
    })

    if (quests.length === 0) return { error: 'No approved quests to export' }

    const questMap = new Map(quests.map((q) => [q.id, q]))

    let ordered: Array<{ quest: (typeof quests)[0]; position: number }>
    if (book.thread?.quests?.length) {
      ordered = book.thread.quests
        .filter((tq) => questMap.has(tq.questId))
        .map((tq, i) => ({ quest: questMap.get(tq.questId)!, position: i + 1 }))
    } else {
      const sorted = [...quests].sort((a, b) => {
        const aIdx = MOVE_ORDER.indexOf((a.moveType as (typeof MOVE_ORDER)[number]) ?? 'growUp')
        const bIdx = MOVE_ORDER.indexOf((b.moveType as (typeof MOVE_ORDER)[number]) ?? 'growUp')
        if (aIdx !== bIdx) return aIdx - bIdx
        return 0
      })
      ordered = sorted.map((q, i) => ({ quest: q, position: i + 1 }))
    }

    const exportData: TwineExportData = {
      book: { id: book.id, title: book.title, author: book.author },
      quests: ordered.map(({ quest, position }) => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        moveType: quest.moveType,
        allyshipDomain: quest.allyshipDomain,
        gameMasterFace: quest.gameMasterFace,
        reward: quest.reward ?? 1,
        position,
      })),
    }

    return exportData
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Export failed'
    return { error: msg }
  }
}
