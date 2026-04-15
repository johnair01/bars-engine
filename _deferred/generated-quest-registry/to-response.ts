import type { GeneratedQuestRegistry } from '@prisma/client'
import type { CreateQuestInput } from '@/lib/generated-quest-registry/schema'

export type CreateQuestResponse = CreateQuestInput & {
  id: string
  bookId: string | null
  createdAt: string
  updatedAt: string
}

type StoredPayload = Pick<CreateQuestInput, 'source' | 'bar' | 'transformation' | 'steps' | 'tags'>

export function registryRowToResponse(row: GeneratedQuestRegistry): CreateQuestResponse {
  const p = row.payload as unknown as StoredPayload
  return {
    id: row.id,
    title: row.title,
    status: row.status as CreateQuestInput['status'],
    chapter: row.chapter,
    moveType: row.moveType as CreateQuestInput['moveType'],
    source: p.source,
    bar: p.bar,
    transformation: p.transformation,
    steps: p.steps,
    tags: p.tags ?? [],
    bookId: row.bookId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
