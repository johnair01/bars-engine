import type { PrismaClient } from '@prisma/client'
import { RECORD_KINDS, validateSave } from './save'

export type ImportDoc = { collection: string; docId: string; data: unknown }
export type ImportResult = { added: string[]; same: number; refused: string[] }

/**
 * Bring documents from the claude.ai artifact store into board_saves without losing or doubling anything: a document
 * identical to the latest row already here is skipped, anything else is appended as a new row with source
 * 'artifact-import', so a rerun adds nothing and nothing here is ever overwritten. Record kinds land unrecorded and
 * the board-pull Action records only what main lacks. Used by scripts/board-import-artifact-store.ts and
 * POST /api/board/import.
 */
export async function importDocs(db: Pick<PrismaClient, 'boardSave'>, board: string, docs: ImportDoc[], dry = false):
    Promise<ImportResult> {
  const out: ImportResult = { added: [], same: 0, refused: [] }
  for (const { collection, docId, data } of docs) {
    const v = validateSave({ board, collection, docId, data })
    if (!v.ok) { out.refused.push(`${collection}/${docId}: ${v.errors.join('; ')}`); continue }
    const latest = await db.boardSave.findFirst({ where: { board, collection, docId }, orderBy: { receivedAt: 'desc' } })
    if (latest && JSON.stringify(latest.data) === JSON.stringify(data)) { out.same++; continue }
    out.added.push(`${collection}/${docId}`)
    if (!dry) await db.boardSave.create({ data: {
      board, collection, docId, data: data as object, source: 'artifact-import',
      recordedAt: RECORD_KINDS.has(collection) ? null : new Date(),
      record: RECORD_KINDS.has(collection) ? null : 'board state; not recorded on main',
    } })
  }
  return out
}
