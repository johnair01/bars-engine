'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const MOVE_ORDER = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const

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
 * Create a QuestThread from an analyzed book's CustomBars.
 * Links quests in move order: Wake Up → Clean Up → Grow Up → Show Up.
 * If book already has a published thread, replaces it (old thread is preserved).
 */
export async function createThreadFromBook(bookId: string) {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) return { error: 'Book not found' }
    if (book.status !== 'analyzed') {
      return { error: 'Book must be in analyzed status to publish. Run Trigger Analysis first.' }
    }

    const quests = await db.customBar.findMany({
      where: {
        completionEffects: { contains: `"bookId":"${bookId}"` },
        status: 'active',
      },
      orderBy: { createdAt: 'asc' },
    })

    if (quests.length === 0) {
      return { error: 'No approved quests. Review and approve quests first.' }
    }

    const questsByMove = [...quests].sort((a, b) => {
      const aIdx = MOVE_ORDER.indexOf((a.moveType as (typeof MOVE_ORDER)[number]) ?? 'growUp')
      const bIdx = MOVE_ORDER.indexOf((b.moveType as (typeof MOVE_ORDER)[number]) ?? 'growUp')
      if (aIdx !== bIdx) return aIdx - bIdx
      return 0
    })

    const existingThread = await db.questThread.findUnique({
      where: { bookId },
    })

    if (existingThread) {
      await db.threadQuest.deleteMany({ where: { threadId: existingThread.id } })
    }

    const thread = existingThread
      ? await db.questThread.update({
          where: { id: existingThread.id },
          data: {
            title: book.title,
            description: book.author ? `From ${book.author}` : 'Quest Library',
            creatorType: 'library',
          },
        })
      : await db.questThread.create({
          data: {
            title: book.title,
            description: book.author ? `From ${book.author}` : 'Quest Library',
            threadType: 'standard',
            creatorType: 'library',
            bookId,
            status: 'active',
          },
        })

    for (let i = 0; i < questsByMove.length; i++) {
      await db.threadQuest.create({
        data: {
          threadId: thread.id,
          questId: questsByMove[i].id,
          position: i + 1,
        },
      })
    }

    await db.book.update({
      where: { id: bookId },
      data: { status: 'published' },
    })

    revalidatePath('/admin/books')
    return {
      success: true,
      threadId: thread.id,
      questCount: questsByMove.length,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Publish failed'
    console.error('[BOOKS] Publish error:', msg)
    return { error: msg }
  }
}
