/** The Stores' move (/board/studio?stores=1): the close stage's room inside the Gourd Star (six-faces-council
 * council/callsheets/stills/2026-10-30-stores-move/design.md, his yes on stores-move-look-1). The keeper closes a run by
 * putting each thing it left somewhere: a jar on the shelf (a record kept), a seed in the basket (a lesson for the next
 * intake), a thread up the bell line (unfinished work sent on) or anything in the compost ring (let go, words kept).
 * The run is one Pacific day of board pulls, the newest day before today that left anything, so the run does not move
 * while he plays it (each placement is itself a save the next pull records). Its things are the day's ledger records:
 *   jar     a step he ticked, or a question he answered whose work is done
 *   seed    a position he let stand
 *   thread  a needs-work line still open
 *   husk    a step he laid down (deprecated or discarded)
 * Each placement is a save to the board store's `stores` collection (docId `<run>~<thing>`), which board-pull records
 * on main (board/pull.py, find_steps). Pure apart from `loadStores`. */
import { listNames, readText } from '@/lib/board/content-store'
import { pullTime, RUN_MS } from './fleet'
import type { BoardData } from './shaman'

export type ThingKind = 'jar' | 'seed' | 'thread' | 'husk'
export type Place = 'shelf' | 'seeds' | 'bell' | 'compost' | 'tide'
export const PLACES: Place[] = ['shelf', 'seeds', 'bell', 'compost', 'tide']
/** What keeping costs from the bowl, and what composting a spent draft gives back (stores-move-purse). */
export const COST: Record<ThingKind, number> = { jar: 1, seed: 1, thread: 2, husk: 0 }
const BACK: Record<ThingKind, number> = { jar: 0, seed: 0, thread: 0, husk: 1 }
/** The floor holds eight things, the room's eight spots. */
export const FLOOR_CAP = 8

export type Thing = { id: string; kind: ThingKind; words: string; st?: Place }
export type StoresWorld = { run: string; day: string; things: Thing[]; beads: number; at: string; demo: boolean }
/** A saved placement, as the `stores` collection holds it. */
export type Placement = { run?: string; thing?: string; kind?: string; words?: string; to?: string; savedAt?: string }
/** A ledger pull as the Stores reads it. */
export type StoresPull = {
  at: string; stem: string
  answers: Record<string, { kind?: string; status?: string; choice?: string }>
  steps: { id?: string; at?: string; what?: string; do?: string }[]
  needs_work: string[]
}

/** The Pacific calendar day of an ISO time, as YYYY-MM-DD. */
export function dayOf(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(iso))
}

/** A save's docId: no slash, at most 200 characters. */
export function placementId(run: string, thing: string): string {
  return `${run}~${thing}`.replace(/[\\/]/g, '.').replace(/[\u0000-\u001f]/g, '').slice(0, 200)
}

/** The bowl a run starts with: three beads for eight things, so keeping everything is out of reach (stores-move-purse). */
export function purseOf(n: number): number { return n ? Math.max(1, Math.round(n * 3 / 8)) : 0 }

function thingsOf(day: StoresPull[], board: BoardData | null, doneKeys: Set<string>): Thing[] {
  const qs = new Map((board?.questions ?? []).map(q => [q.id, q.q ?? q.id]))
  const ps = new Map((board?.positions ?? []).map(p => [p.id, p.pos ?? p.id]))
  const open = new Set<string>()
  const lists: Record<ThingKind, Thing[]> = { jar: [], seed: [], thread: [], husk: [] }
  for (const p of day) for (const line of p.needs_work ?? []) {
    const i = line.indexOf(': ')
    const row = i < 0 ? line : line.slice(0, i), what = i < 0 ? line : line.slice(i + 2), key = `${p.stem}#${row}`
    open.add(row.replace(/^(questions|positions|steps)\//, ''))
    if (!doneKeys.has(key)) lists.thread.push({ id: key, kind: 'thread', words: what })
  }
  for (const p of day) {
    for (const [id, a] of Object.entries(p.answers ?? {})) {
      if (open.has(id)) continue
      if (a.kind === 'position' && a.status === 'stands') lists.seed.push({ id: `${p.stem}#positions/${id}`, kind: 'seed', words: ps.get(id) ?? id })
      else if (a.kind === 'question') lists.jar.push({ id: `${p.stem}#questions/${id}`, kind: 'jar', words: qs.get(id) ?? id })
    }
    for (const s of p.steps ?? []) {
      if (!s.id) continue
      if (s.what === 'ticked') lists.jar.push({ id: `${p.stem}#steps/${s.id}`, kind: 'jar', words: s.do || s.id })
      else if (s.what === 'deprecated' || s.what === 'discarded') lists.husk.push({ id: `${p.stem}#steps/${s.id}`, kind: 'husk', words: s.do || s.id })
    }
  }
  // one of each kind in turn, so a full floor always asks the purse question
  const out: Thing[] = [], order: ThingKind[] = ['jar', 'husk', 'seed', 'thread']
  for (let n = 0; out.length < FLOOR_CAP && order.some(k => lists[k].length > n); n++)
    for (const k of order) if (lists[k][n] && out.length < FLOOR_CAP) out.push(lists[k][n])
  return out
}

export function storesWorldOf(input: {
  pulls: StoresPull[]; board: BoardData | null; doneKeys: string[]; placed: Record<string, Placement>; now?: Date
}): StoresWorld {
  const now = input.now ?? new Date(), today = dayOf(now.toISOString()), done = new Set(input.doneKeys)
  const days = [...new Set(input.pulls.map(p => dayOf(p.at)))].filter(d => d < today).sort().reverse()
  for (const day of days) {
    const run = `run-${day}`
    const things = thingsOf(input.pulls.filter(p => dayOf(p.at) === day).sort((a, b) => a.at.localeCompare(b.at)), input.board, done)
    if (!things.length) continue
    let beads = purseOf(things.length)
    for (const t of things) {
      const to = input.placed[placementId(run, t.id)]?.to as Place | undefined
      if (!to || !PLACES.includes(to)) continue
      t.st = to
      beads += to === 'compost' || to === 'tide' ? BACK[t.kind] : -COST[t.kind]
    }
    return { run, day, things, beads: Math.max(0, beads), at: now.toISOString(), demo: false }
  }
  return { run: '', day: '', things: [], beads: 0, at: now.toISOString(), demo: false }
}

/** The run of the round's mock (ship run 1's still round), for &demo=1 and for a ledger with nothing to close. Nothing
 * it does is saved. */
export function demoStores(now = new Date()): StoresWorld {
  const t = (kind: ThingKind, words: string, i: number): Thing => ({ id: `demo-${i}`, kind, words })
  const things = [
    t('jar', "The art director's review of the plane still", 0), t('husk', 'Stills v1 to v5, set aside', 1),
    t('seed', 'Look up what already draws it before drawing', 2), t('thread', "The hull's ends, still undrawn", 3),
    t('jar', "The plane still's rows, landed on the board", 4), t('husk', 'A second gourd, drawn from nothing', 5),
    t('seed', 'On a phone, crop the chamber; never shrink the hull', 6), t('jar', "The Challenger's objection: the Bell first", 7),
  ]
  return { run: 'demo', day: '', things, beads: purseOf(things.length), at: now.toISOString(), demo: true }
}

function json<T>(s: string | null): T | null { try { return s ? JSON.parse(s) as T : null } catch { return null } }

/** The Stores' world as main has it now: the last eight days of ledger pulls, the board's words, what is done, and the
 * placements already saved. Null when the ledger can't be read. */
export async function loadStores(placed: Record<string, Placement>, now = new Date()): Promise<StoresWorld | null> {
  const names = await listNames('council/ledger/')
  if (!names.length) return null
  const timed = names.map(n => ({ n, t: pullTime(n) })).filter((x): x is { n: string; t: string } => !!x.t)
  const recent = timed.filter(x => now.getTime() - Date.parse(x.t) < 8 * RUN_MS)
  const pulls = (await Promise.all(recent.map(async (x): Promise<StoresPull | null> => {
    const j = json<Partial<StoresPull>>(await readText('council/ledger/' + x.n))
    return j ? { at: x.t, stem: x.n.replace(/\.json$/, ''), answers: j.answers ?? {}, steps: j.steps ?? [], needs_work: j.needs_work ?? [] } : null
  }))).filter((p): p is StoresPull => !!p)
  const doneFile = json<{ done?: Record<string, unknown> }>(await readText('council/needs-work-done.json'))
  const board = json<BoardData>(await readText('board/board_data.json'))
  return storesWorldOf({ pulls, board, doneKeys: Object.keys(doneFile?.done ?? {}), placed, now })
}
