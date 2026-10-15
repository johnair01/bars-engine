import 'server-only'
import { db } from '@/lib/db'

export type Docs = Record<string, Record<string, Record<string, unknown>>>

/** The latest document per (collection, docId): what the claude.ai store used to hold. */
export async function latestDocs(board: string): Promise<Docs> {
  const rows = await db.$queryRaw<{ collection: string; doc_id: string; data: Record<string, unknown> }[]>`
    SELECT DISTINCT ON (collection, doc_id) collection, doc_id, data
    FROM board_saves WHERE board = ${board}
    ORDER BY collection, doc_id, received_at DESC, id DESC`
  const out: Docs = {}
  for (const r of rows) (out[r.collection] ??= {})[r.doc_id] = r.data
  return out
}

export async function latestDoc(board: string, collection: string, docId: string) {
  const row = await db.boardSave.findFirst({
    where: { board, collection, docId }, orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], select: { data: true },
  })
  return (row?.data as Record<string, unknown> | undefined) ?? null
}

export async function lastPull(board: string) {
  return db.boardPull.findFirst({ where: { board }, orderBy: { at: 'desc' }, select: { at: true, record: true } })
}

/** Saves still waiting for the pull to record them: the earliest one's receivedAt and how many there are. */
export async function unrecordedSaves(board: string) {
  const where = { board, recordedAt: null }
  const [oldest, count] = await Promise.all([
    db.boardSave.findFirst({ where, orderBy: { receivedAt: 'asc' }, select: { receivedAt: true } }),
    db.boardSave.count({ where }),
  ])
  return { oldestReceivedAt: oldest?.receivedAt ?? null, count }
}
