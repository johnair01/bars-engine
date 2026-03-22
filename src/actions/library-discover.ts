'use server'

import { db } from '@/lib/db'

export type DiscoverableQuest = {
  id: string
  title: string
  description: string
  moveType: string
  bookTitle: string | null
}

/**
 * Fetch 1-2 quests from the library (book-analysis pipeline) that match the given moveType.
 * These are quests with completionEffects containing `source: "library"`.
 * Called from the NOW dashboard Discover strip.
 */
export async function getLibraryQuestsForMove(
  moveType: string,
  limit = 2
): Promise<DiscoverableQuest[]> {
  // completionEffects is a JSON string: { source: 'library', bookId: '...' }
  const quests = await db.customBar.findMany({
    where: {
      moveType,
      status: 'active',
      visibility: 'public',
      completionEffects: { contains: '"source":"library"' },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 4, // overfetch so we can de-dupe by book
    select: { id: true, title: true, description: true, moveType: true, completionEffects: true },
  })

  if (quests.length === 0) return []

  // Resolve book titles from completionEffects.bookId
  const bookIds = [
    ...new Set(
      quests.flatMap((q) => {
        try {
          const e = JSON.parse(q.completionEffects ?? '{}') as { bookId?: string }
          return e.bookId ? [e.bookId] : []
        } catch {
          return []
        }
      })
    ),
  ]

  const books = bookIds.length
    ? await db.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true, title: true },
      })
    : []

  const bookMap = Object.fromEntries(books.map((b) => [b.id, b.title]))

  // Pick at most one quest per book, up to limit
  const seen = new Set<string>()
  const results: DiscoverableQuest[] = []

  for (const q of quests) {
    try {
      const e = JSON.parse(q.completionEffects ?? '{}') as { bookId?: string }
      const bookKey = e.bookId ?? 'unknown'
      if (seen.has(bookKey)) continue
      seen.add(bookKey)
      results.push({
        id: q.id,
        title: q.title,
        description: q.description,
        moveType: q.moveType ?? moveType,
        bookTitle: e.bookId ? (bookMap[e.bookId] ?? null) : null,
      })
      if (results.length >= limit) break
    } catch {
      // skip malformed
    }
  }

  return results
}
