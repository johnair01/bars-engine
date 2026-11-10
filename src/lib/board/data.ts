import 'server-only'
import { latestDocs, type Docs } from './store'
import { readText } from './content-store'

/** The repo path six-faces-council pushes board_data.json under (content-store's ALLOWED list). */
export const DATA_PATH = 'board/board_data.json'

/**
 * The collections the store serves as live rows. `board/pull.py` writes positions, questions, terms and causes into
 * board_data.json as lists, so a document per row becomes one list entry here. The rest are folded back into the shape
 * the page reads: `resolved` under its kind and id, `draws` and `weather_log` as maps, `morning` and `intake` as the one
 * record each, and `battles` as the list the record keeps. six-faces-council board/copy_write.py sends those five, so no
 * key the page draws waits on a push (Wendell, 2026-11-05: "the Page shouldn't be carrying its own data. It should all
 * be served via the API").
 */
export const FROM_STORE = ['positions', 'questions', 'terms', 'causes', 'picks', 'resolved', 'draws', 'battles',
  'morning', 'intake'] as const

/** The record's `resolved`: settled answers under their kind, then their id. */
export type Resolved = Record<string, Record<string, Record<string, unknown>>>
/** One collection's documents, under their docId. */
type Held = Record<string, Record<string, unknown>>

function safeJson(text: string | null): Record<string, unknown> | null {
  if (!text) return null
  try {
    const v = JSON.parse(text)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** A document without the fields the store adds to it, so the page draws what the record held. */
function without(doc: Record<string, unknown>, ...fields: string[]): Record<string, unknown> {
  const out = { ...doc }
  for (const f of fields) delete out[f]
  return out
}

/**
 * The record's keys with the store's live rows laid over them. A collection the store holds wins whole, so an answer
 * he saved shows on the next load without a push. A collection the store cannot answer keeps the record's copy.
 */
export function merge(record: Record<string, unknown>, docs: Docs): Record<string, unknown> {
  const out: Record<string, unknown> = { ...record }
  for (const c of FROM_STORE) {
    const held = docs[c]
    if (!held || !Object.keys(held).length) continue
    // One settled answer per document, so a settled answer the record never saw lands beside the ones it did.
    if (c === 'resolved') out.resolved = foldResolved((record.resolved as Resolved | undefined) ?? {}, held)
    else if (c === 'morning') Object.assign(out, foldMorning(record, held))
    else if (c === 'intake') { const run = held.latest; if (run) out.intake = without(run, 'savedAt') }
    else if (c === 'battles') out.battles = foldBattles(held)
    else if (c === 'draws') out.draws = { ...((record.draws as Held | undefined) ?? {}), ...held }
    else out[c] = overlay((record[c] as Entry[] | undefined) ?? [], held)
  }
  return out
}

type Entry = Record<string, unknown>

/**
 * A list collection's store documents laid over the record's entries by id. The store's `questions`, `positions`,
 * `terms` and `causes` documents carry only what he saved (choice, status, steer, savedAt), never the question's text or
 * options, so replacing the record's list with them left the page with nothing to draw. Each entry keeps the record's
 * fields; a document's own fields win; a document the record has no entry for is added.
 */
export function overlay(record: Entry[], held: Held): Entry[] {
  const seen = new Set<string>()
  const out = record.map((entry) => {
    const id = typeof entry.id === 'string' ? entry.id : ''
    const doc = id ? held[id] : undefined
    if (id) seen.add(id)
    return doc ? { ...entry, ...doc } : entry
  })
  for (const [id, doc] of Object.entries(held)) if (!seen.has(id)) out.push(doc)
  return out
}

/** The store's one-document-per-entry resolved rows, back in the shape the page reads: `{ kind: { id: entry } }`. */
export function foldResolved(record: Resolved, docs: Held): Resolved {
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
 * The `morning` collection holds two shapes: the gather the page draws, at gather, and one document per weather glass
 * reading, at weather--<time>, which the page reads as `weather_log` under that docId.
 */
export function foldMorning(record: Record<string, unknown>, held: Held): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const gather = held.gather
  if (gather) out.morning = without(gather, 'savedAt')
  const weather: Held = { ...((record.weather_log as Held | undefined) ?? {}) }
  for (const [id, doc] of Object.entries(held)) if (id.startsWith('weather--')) weather[id] = doc
  if (Object.keys(weather).length) out.weather_log = weather
  return out
}

/** One document per battle, back as the list the page reads, in the order the record kept (`order`, then id). */
export function foldBattles(held: Held): Record<string, unknown>[] {
  return Object.values(held)
    .map((doc) => ({ doc, order: Number(doc.order) || 0 }))
    .sort((a, b) => a.order - b.order || String(a.doc.id ?? '').localeCompare(String(b.doc.id ?? '')))
    .map(({ doc }) => without(doc, 'order', 'savedAt'))
}

/**
 * The board data the page draws: the store's documents over the pushed record. Null only when neither answers, so the
 * page keeps drawing the copy it carries instead of an empty board.
 */
export async function boardData(board = 'council'): Promise<Record<string, unknown> | null> {
  const [copy, docs] = await Promise.all([
    readText(DATA_PATH).catch(() => null),
    latestDocs(board).catch(() => ({}) as Docs),
  ])
  const record = safeJson(copy)
  if (!record && !Object.keys(docs).length) return null
  return merge(record ?? {}, docs)
}
