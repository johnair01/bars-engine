import { createHash } from 'crypto'
import type { PrismaClient } from '@prisma/client'
import { applyWrite, validateSave } from './save'

/** What a Claude session writes to the Council Board: the Your steps lists and steps, and Outreach's contacts and
 * shows. His answers (positions, questions, ...) are his to save, never a session's. */
export const SESSION_COLLECTIONS = new Set(['lists', 'steps', 'contacts', 'shows'])

export type SessionDoc = { collection: string; docId: string; mode?: 'set' | 'update'; data: unknown }
export type SessionResult = { written: string[]; same: number; refused: string[] }

/** JSON with keys sorted at every level, so a document hashes the same here (jsonb reorders keys) and in
 * Six-faces-council board/store_write.py (json.dumps sort_keys, no spaces). */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  if (v && typeof v === 'object')
    return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(',')}}`
  return JSON.stringify(v)
}
export const docHash = (v: unknown) => createHash('sha256').update(canonical(v)).digest('hex').slice(0, 16)

/**
 * A session's write to board=council (board-home step 5). `update` (the default) merges top-level fields onto the
 * latest document, so a session that rewrites a step's text keeps the tick, note and moves Wendell saved on the page;
 * `set` replaces. A write that changes nothing is skipped, so a rerun adds nothing. Rows are born recorded: they are
 * the council's own writes, not answers for board-pull to land.
 */
export async function sessionWrite(db: Pick<PrismaClient, 'boardSave'>, docs: SessionDoc[], dry = false):
    Promise<SessionResult> {
  const out: SessionResult = { written: [], same: 0, refused: [] }
  for (const { collection, docId, mode = 'update', data } of docs) {
    const key = `${collection}/${docId}`
    if (!SESSION_COLLECTIONS.has(collection)) { out.refused.push(`${key}: sessions write lists, steps, contacts, shows`); continue }
    const v = validateSave({ board: 'council', collection, docId, mode, data })
    if (!v.ok) { out.refused.push(`${key}: ${v.errors.join('; ')}`); continue }
    const latest = await db.boardSave.findFirst({
      where: { board: 'council', collection, docId }, orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    })
    const prev = (latest?.data as Record<string, unknown> | undefined) ?? null
    const next = applyWrite(prev, v.save)
    if (prev && canonical(prev) === canonical(next)) { out.same++; continue }
    out.written.push(key)
    if (!dry) await db.boardSave.create({ data: {
      board: 'council', collection, docId, data: next as object, source: 'session',
      recordedAt: new Date(), record: 'session write; not an answer',
    } })
  }
  return out
}
