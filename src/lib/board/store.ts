import 'server-only'
import { db } from '@/lib/db'

export type Docs = Record<string, Record<string, Record<string, unknown>>>

/** Prisma Accelerate refuses a query whose answer passes 5 MB (P6009). The council board's latest documents passed that
 * on 2026-10-31 (5.03 MB), and the one query that read them all failed: the board page lost its store and showed "This
 * view cannot save", and board-pull, session-writes and import failed with it. So the read is two steps: first the id
 * and size of each latest document (small), then the documents themselves in batches kept well under the limit. */
const BATCH_BYTES = 2_000_000
const BATCH_ROWS = 500

/** Split latest-document ids into batches of at most BATCH_BYTES (by JSON text size) and BATCH_ROWS each. A single
 * document larger than BATCH_BYTES goes alone. Exported for the test. */
export function batchIds(heads: { id: string; bytes: number }[], maxBytes = BATCH_BYTES, maxRows = BATCH_ROWS): string[][] {
  const out: string[][] = []
  let cur: string[] = [], size = 0
  for (const h of heads) {
    const b = Number(h.bytes) || 0
    if (cur.length && (size + b > maxBytes || cur.length >= maxRows)) { out.push(cur); cur = []; size = 0 }
    cur.push(h.id); size += b
  }
  if (cur.length) out.push(cur)
  return out
}

/** The latest document per (collection, docId): what the claude.ai store used to hold. */
export async function latestDocs(board: string): Promise<Docs> {
  const heads = await db.$queryRaw<{ id: string; bytes: number }[]>`
    SELECT id, bytes FROM (
      SELECT DISTINCT ON (collection, doc_id) id, octet_length(data::text)::int AS bytes
      FROM board_saves WHERE board = ${board}
      ORDER BY collection, doc_id, received_at DESC, id DESC
    ) h`
  const out: Docs = {}
  for (const ids of batchIds(heads)) {
    const rows = await db.boardSave.findMany({ where: { id: { in: ids } }, select: { collection: true, docId: true, data: true } })
    for (const r of rows) (out[r.collection] ??= {})[r.docId] = r.data as Record<string, unknown>
  }
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
