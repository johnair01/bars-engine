import 'server-only'
import { latestDocs, type Docs } from './store'

/**
 * The collections the page draws, all of them from bars-engine's own store. The council's pull keeps its record in
 * board/board_data.json on main, and the page reads none of it: what it draws is here, folded back into the shape it
 * expects. `resolved` goes under its kind and id, `draws` and `weather_log` come back as maps, `morning` and `intake`
 * as the one record each, and `battles` as the list the record keeps. Wendell, 2026-11-09: "the copy needs to stop
 * being written. If the store is down the store is down. I don't want a fallback".
 */
export const FROM_STORE = ['positions', 'questions', 'terms', 'causes', 'picks', 'resolved', 'draws', 'battles',
  'morning', 'intake'] as const

/** Settled answers under their kind, then their id. */
export type Resolved = Record<string, Record<string, Record<string, unknown>>>
/** One collection's documents, under their docId. */
type Held = Record<string, Record<string, unknown>>

/** A document without the fields the store adds to it, so the page draws what the council recorded. */
function without(doc: Record<string, unknown>, ...fields: string[]): Record<string, unknown> {
  const out = { ...doc }
  for (const f of fields) delete out[f]
  return out
}

/** The store's documents in the shape the page reads. A collection the store cannot answer is left out whole. */
export function merge(docs: Docs): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of FROM_STORE) {
    const held = docs[c]
    if (!held || !Object.keys(held).length) continue
    if (c === 'resolved') out.resolved = foldResolved(held)
    else if (c === 'morning') Object.assign(out, foldMorning(held))
    else if (c === 'intake') { const run = held.latest; if (run) out.intake = without(run, 'savedAt') }
    else if (c === 'battles') out.battles = foldBattles(held)
    else if (c === 'draws') out.draws = { ...held }
    else out[c] = Object.values(held)
  }
  return out
}

/** The store's one-document-per-entry resolved rows, back in the shape the page reads: `{ kind: { id: entry } }`. */
export function foldResolved(docs: Held): Resolved {
  const out: Resolved = {}
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
export function foldMorning(held: Held): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const gather = held.gather
  if (gather) out.morning = without(gather, 'savedAt')
  const weather: Held = {}
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
 * The board data the page draws, from the store alone. Null when the store answers nothing, so the page draws no
 * board at all and the fault is named, rather than a copy that hides it.
 */
export async function boardData(board = 'council'): Promise<Record<string, unknown> | null> {
  const docs = await latestDocs(board).catch(() => ({}) as Docs)
  return Object.keys(docs).length ? merge(docs) : null
}
