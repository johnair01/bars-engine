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

/** Heads to read: a posted row that board-pull has recorded is on main and the board page skips it, so the page's
 * read can leave it out (council pass board-store-size-1, 2026-10-31). Exported for the test. */
export function readableHeads<T extends { collection: string; recorded: boolean }>(heads: T[], leaveOutRecordedRows: boolean): T[] {
  return leaveOutRecordedRows ? heads.filter((h) => !(h.collection === 'rows' && h.recorded)) : heads
}

/** The latest document per (collection, docId): what the claude.ai store used to hold. With leaveOutRecordedRows, the
 * `rows` documents main already records are left out (the page's read, GET /api/board/saves); board-pull and the
 * other routes read everything. */
export async function latestDocs(board: string, opts: { leaveOutRecordedRows?: boolean } = {}): Promise<Docs> {
  const all = await db.$queryRaw<{ id: string; bytes: number; collection: string; recorded: boolean }[]>`
    SELECT id, bytes, collection, recorded FROM (
      SELECT DISTINCT ON (collection, doc_id) id, collection, octet_length(data::text)::int AS bytes,
        recorded_at IS NOT NULL AS recorded
      FROM board_saves WHERE board = ${board}
      ORDER BY collection, doc_id, received_at DESC, id DESC
    ) h`
  const heads = readableHeads<(typeof all)[number]>(all, !!opts.leaveOutRecordedRows)
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
