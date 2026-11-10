import 'server-only'
import { latestDocs } from './store'
import { readText } from './content-store'

/** The repo path six-faces-council pushes board_data.json under (content-store's ALLOWED list). */
export const DATA_PATH = 'board/board_data.json'

/**
 * The collections the store serves as live rows. `board/pull.py` writes them into board_data.json as lists, so a
 * document per row becomes one list entry here, and `resolved` is folded back from one document per settled
 * answer. Every other key (battles, morning, intake, draws, weather_log, list_reads) is the council's record and
 * lives only in the pushed copy: the store has no collection for it. Wendell, 2026-11-05: "the Page shouldn't be carrying its own data. It should all be served via the API".
 */
export const FROM_STORE = ['positions', 'questions', 'terms', 'causes', 'picks', 'resolved'] as const

/** The record's `resolved`: settled answers under their kind, then their id. */
export type Resolved = Record<string, Record<string, Record<string, unknown>>>

function safeJson(text: string | null): Record<string, unknown> | null {
  if (!text) return null
  try {
    const v = JSON.parse(text)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * The record's keys with the store's live rows laid over them. A collection the store holds wins whole, so an answer
 * he saved shows on the next load without a push. A collection the store cannot answer keeps the record's copy.
 */
export function merge(record: Record<string, unknown>, docs: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...record }
  for (const c of FROM_STORE) {
    const held = docs[c]
    if (!held || !Object.keys(held).length) continue
    // One settled answer per document, so a settled answer the record never saw lands beside the ones it did.
    if (c === 'resolved') out.resolved = foldResolved((record.resolved as Resolved | undefined) ?? {}, held as Record<string, Record<string, unknown>>)
    else out[c] = Object.values(held)
  }
  return out
}

/** The store's one-document-per-entry resolved rows, back in the shape the page reads: `{ kind: { id: entry } }`. */
export function foldResolved(record: Resolved, docs: Record<string, Record<string, unknown>>): Resolved {
  const out: Resolved = {}
  for (const [kind, entries] of Object.entries(record ?? {})) out[kind] = { ...entries }
  for (const doc of Object.values(docs)) {
    const kind = typeof doc.kind === 'string' ? doc.kind : ''
    const id = typeof doc.id === 'string' ? doc.id : ''
    if (!kind || !id) continue
    const entry = { ...doc }
    delete entry.kind
    delete entry.id
    delete entry.savedAt
    out[kind] = { ...(out[kind] ?? {}), [id]: entry }
  }
  return out
}

/**
 * The board data the page draws: the store's documents over the pushed record. Null only when neither answers, so the
 * page keeps drawing the copy it carries instead of an empty board.
 */
export async function boardData(board = 'council'): Promise<Record<string, unknown> | null> {
  const [copy, docs] = await Promise.all([
    readText(DATA_PATH).catch(() => null),
    latestDocs(board).catch(() => ({}) as Record<string, Record<string, unknown>>),
  ])
  const record = safeJson(copy)
  if (!record && !Object.keys(docs).length) return null
  return merge(record ?? {}, docs)
}
