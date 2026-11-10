import 'server-only'
import { latestDocs, type Docs } from './store'

/**
 * The board's cards and the answers on them, all from bars-engine's own store. `rows` holds one document per card, its
 * `kind` naming the list the page draws and `order` keeping its place (six-faces-council board/post_rows.py posts them,
 * and board/backfill_store.py put the record there). `positions`, `questions`, `terms`, `causes` and `picks` hold what
 * he saved, one document per answer, laid over the card of the same id. `resolved`, `draws`, `morning`, `intake` and
 * `battles` fold back into the shapes the page reads. Nothing is read from a pushed copy (Wendell, 2026-11-09: "the
 * copy needs to stop being written. If the store is down the store is down. I don't want a fallback").
 */
export const FROM_STORE = ['rows', 'positions', 'questions', 'terms', 'causes', 'picks', 'resolved', 'draws', 'battles',
  'morning', 'intake'] as const

/** The lists the page draws out of cards, in the order their rows fold. */
export const LISTS = ['positions', 'questions', 'terms', 'causes', 'battles'] as const

/** Settled answers under their kind, then their id. */
export type Resolved = Record<string, Record<string, Record<string, unknown>>>
/** One collection's documents, under their docId. */
type Held = Record<string, Record<string, unknown>>
type Doc = Record<string, unknown>

/** A document without the fields the store adds to it, so the page draws what the council recorded. */
function without(doc: Doc, ...fields: string[]): Doc {
  const out = { ...doc }
  for (const f of fields) delete out[f]
  return out
}

/** Cards in the order the record kept: `order` first, then the id, so a list never shuffles between loads. */
export function foldRows(rows: Held): Record<string, Doc[]> {
  const held: Record<string, { doc: Doc; order: number; id: string }[]> = {}
  for (const [id, row] of Object.entries(rows)) {
    const kind = typeof row.kind === 'string' ? row.kind : ''
    if (!(LISTS as readonly string[]).includes(kind)) continue
    const doc = { id, ...without(row, 'kind', 'id', 'order', 'savedAt') }
    ;(held[kind] ??= []).push({ doc, order: Number(row.order) || 0, id })
  }
  const out: Record<string, Doc[]> = {}
  for (const [kind, list] of Object.entries(held))
    out[kind] = list.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)).map((e) => e.doc)
  return out
}

/**
 * The answers he saved, laid over the cards by id. An answer document carries only what he set (a choice, a status, a
 * steer, a savedAt), so the card keeps its text and options; an answer for a card the store has no row for is left out, since it holds no text and the page cannot draw it.
 */
export function overlay(cards: Doc[], answers: Held): Doc[] {
  const seen = new Set<string>()
  const out = cards.map((card) => {
    const id = typeof card.id === 'string' ? card.id : ''
    const answer = id ? answers[id] : undefined
    if (id) seen.add(id)
    return answer ? { ...card, ...answer } : card
  })
  return out
}

/** The store's one-document-per-entry resolved rows, back in the shape the page reads: `{ kind: { id: entry } }`. */
export function foldResolved(docs: Held): Resolved {
  const out: Resolved = {}
  for (const doc of Object.values(docs)) {
    const kind = typeof doc.kind === 'string' ? doc.kind : ''
    const id = typeof doc.id === 'string' ? doc.id : ''
    if (!kind || !id) continue
    out[kind] = { ...(out[kind] ?? {}), [id]: without(doc, 'kind', 'id', 'savedAt') }
  }
  return out
}

/**
 * The settled record, from the store's `records` documents: each is one file of the council's record, and the ones of
 * kind `resolved` carry a decided row as JSON text under `body`, named `<kind>/<id>`. They fold into the same
 * `{ kind: { id: entry } }` shape, so a row that is settled stays out of Open.
 */
export function foldRecords(held: Held): Resolved {
  const out: Resolved = {}
  for (const doc of Object.values(held)) {
    if (doc.kind !== 'resolved' || typeof doc.name !== 'string' || typeof doc.body !== 'string') continue
    const at = doc.name.indexOf('/')
    if (at < 1) continue
    let entry: unknown
    try { entry = JSON.parse(doc.body) } catch { continue }
    if (!entry || typeof entry !== 'object') continue
    const kind = doc.name.slice(0, at), id = doc.name.slice(at + 1)
    out[kind] = { ...(out[kind] ?? {}), [id]: entry as Record<string, unknown> }
  }
  return out
}

/**
 * The `morning` collection holds two shapes: the gather the page draws, at gather, and one document per weather glass
 * reading, at weather--<time>, which the page reads as `weather_log` under that docId.
 */
export function foldMorning(held: Held): Doc {
  const out: Doc = {}
  const gather = held.gather
  if (gather) out.morning = without(gather, 'savedAt')
  const weather: Held = {}
  for (const [id, doc] of Object.entries(held)) if (id.startsWith('weather--')) weather[id] = doc
  if (Object.keys(weather).length) out.weather_log = weather
  return out
}

/** One document per battle, back as the list the page reads, in the order the record kept (`order`, then id). */
export function foldBattles(held: Held): Doc[] {
  return Object.values(held)
    .map((doc) => ({ doc, order: Number(doc.order) || 0 }))
    .sort((a, b) => a.order - b.order || String(a.doc.id ?? '').localeCompare(String(b.doc.id ?? '')))
    .map(({ doc }) => without(doc, 'order', 'savedAt'))
}

/** The board's data in the shape the page reads, from the store alone. */
export function merge(docs: Docs): Doc {
  const out: Doc = {}
  for (const [kind, cards] of Object.entries(foldRows(docs.rows ?? {})))
    out[kind] = overlay(cards, docs[kind] ?? {})
  const resolved = foldRecords(docs.records ?? {})
  for (const [kind, entries] of Object.entries(foldResolved(docs.resolved ?? {}))) resolved[kind] = { ...(resolved[kind] ?? {}), ...entries }
  // Always present, so the page can look up any kind before anything is settled.
  out.resolved = { positions: {}, questions: {}, terms: {}, causes: {}, ...resolved }
  const morning = docs.morning
  if (morning && Object.keys(morning).length) Object.assign(out, foldMorning(morning))
  const intake = docs.intake?.latest
  if (intake) out.intake = without(intake, 'savedAt')
  const draws = docs.draws
  if (draws && Object.keys(draws).length) out.draws = { ...draws }
  const picks = docs.picks
  if (picks && Object.keys(picks).length) out.picks = Object.entries(picks).map(([id, d]) => ({ id, ...d }))
  const battles = docs.battles
  if (battles && Object.keys(battles).length) out.battles = foldBattles(battles)
  return out
}

/**
 * The board data the page draws, from the store alone. Null when the store answers nothing, so the page draws no board
 * at all and the fault is named, rather than a copy that hides it.
 */
export async function boardData(board = 'council'): Promise<Doc | null> {
  const docs = await latestDocs(board).catch(() => ({}) as Docs)
  return Object.keys(docs).length ? merge(docs) : null
}
