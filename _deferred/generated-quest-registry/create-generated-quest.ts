import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import type { CreateQuestInput } from '@/lib/generated-quest-registry/schema'

export class UnknownBookError extends Error {
  constructor(public readonly bookId: string) {
    super(`Book not found: ${bookId}`)
    this.name = 'UnknownBookError'
  }
}

/**
 * Persist a validated BAR-forge / GPT quest payload to the global registry.
 */
export async function createGeneratedQuestRecord(input: CreateQuestInput) {
  const bookId = input.bookId ?? null
  if (bookId) {
    const book = await db.book.findUnique({ where: { id: bookId }, select: { id: true } })
    if (!book) {
      throw new UnknownBookError(bookId)
    }
  }

  const payload: Prisma.InputJsonValue = {
    source: input.source,
    bar: input.bar,
    transformation: input.transformation,
    steps: input.steps,
    tags: input.tags ?? [],
  }

  return db.generatedQuestRegistry.create({
    data: {
      title: input.title,
      status: input.status,
      chapter: input.chapter,
      moveType: input.moveType,
      bookId,
      payload,
    },
  })
}
