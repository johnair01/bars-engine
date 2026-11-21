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

export type ThingKind = 'jar' | 'seed' | 'thread' | 'husk' | 'crate'
export type Place = 'shelf' | 'seeds' | 'bell' | 'compost' | 'tide'
export const PLACES: Place[] = ['shelf', 'seeds', 'bell', 'compost', 'tide']
/** What keeping costs from the bowl, and what composting a spent draft gives back (stores-move-purse). */
export const COST: Record<ThingKind, number> = { jar: 1, seed: 1, thread: 2, husk: 0, crate: 1 }
const BACK: Record<ThingKind, number> = { jar: 0, seed: 0, thread: 0, husk: 1, crate: 0 }
/** The floor holds eight things, the room's eight spots. */
export const FLOOR_CAP = 8

/** A crate is a finished asset (the gallery's `recent` view): `pic` is its picture's url, `title` its name, `place` the
 * round it was made in. A crate's placement is saved under the run key CRATE_RUN, so a crate placed once never returns. */
export type Thing = { id: string; kind: ThingKind; words: string; st?: Place; pic?: string; title?: string; place?: string }
/** A planned row not yet made, stencilled on the shelf (the gallery's `holes` view, cheapest first). */
export type StoresHole = { id: string; title: string; words: string; price: string }
export type StoresWorld = { run: string; day: string; things: Thing[]; beads: number; at: string; demo: boolean; hole?: StoresHole | null }
export const CRATE_RUN = 'gallery'
/** At most this many crates share the floor with a run's leftovers. */
export const CRATE_CAP = 3
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
  const lists: Record<ThingKind, Thing[]> = { jar: [], seed: [], thread: [], husk: [], crate: [] }
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
  crates?: Thing[]; hole?: StoresHole | null
}): StoresWorld {
  const now = input.now ?? new Date(), today = dayOf(now.toISOString()), done = new Set(input.doneKeys)
  // a crate placed once, under the gallery's run key, has left the floor for good
  const crates = (input.crates ?? []).filter(c => !input.placed[placementId(CRATE_RUN, c.id)]).slice(0, CRATE_CAP)
  const hole = input.hole ?? null, room = FLOOR_CAP - crates.length
  const days = [...new Set(input.pulls.map(p => dayOf(p.at)))].filter(d => d < today).sort().reverse()
  for (const day of days) {
    const run = `run-${day}`
    const left = thingsOf(input.pulls.filter(p => dayOf(p.at) === day).sort((a, b) => a.at.localeCompare(b.at)), input.board, done).slice(0, room)
    if (!left.length) continue
    let beads = purseOf(left.length + crates.length)
    for (const t of left) {
      const to = input.placed[placementId(run, t.id)]?.to as Place | undefined
      if (!to || !PLACES.includes(to)) continue
      t.st = to
      beads += to === 'compost' || to === 'tide' ? BACK[t.kind] : -COST[t.kind]
    }
    return { run, day, things: [...crates, ...left], beads: Math.max(0, beads), at: now.toISOString(), demo: false, hole }
  }
  return { run: crates.length ? 'run-gallery' : '', day: '', things: crates, beads: purseOf(crates.length), at: now.toISOString(), demo: false, hole }
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
  const crates: Thing[] = [
    { id: 'demo-c1', kind: 'crate', words: 'Raise heaven to 7, part 12', title: 'The sect hall from above', place: 'the heaven climb, round 28', pic: '/studio/demo/crate-1.jpg' },
    { id: 'demo-c2', kind: 'crate', words: 'Raise heaven to 7, part 11', title: 'The hall at the stair head', place: 'the heaven climb, round 27', pic: '/studio/demo/crate-2.jpg' },
  ]
  const all = [...crates, ...things.slice(0, FLOOR_CAP - crates.length)]
  return { run: 'demo', day: '', things: all, beads: purseOf(all.length), at: now.toISOString(), demo: true,
    hole: { id: 'demo-hole', title: 'A carried object, not yet made', words: "A sealed bundle in its feeling's colour, for the nook's shelf", price: 'About 20,000 tokens, no dollars' } }
}

function json<T>(s: string | null): T | null { try { return s ? JSON.parse(s) as T : null } catch { return null } }

/** The Stores' world as main has it now: the last eight days of ledger pulls, the board's words, what is done, and the
 * placements already saved. Null when the ledger can't be read. */
export async function loadStores(placed: Record<string, Placement>, now = new Date()): Promise<StoresWorld | null> {
  const names = await listNames('council/ledger/')
  if (!names.length) return null
  const timed = names.map(n => ({ n, t: pullTime(n) })).filter((x): x is { n: string; t: string } => !!x.t)
  const inWindow = timed.filter(x => now.getTime() - Date.parse(x.t) < 8 * RUN_MS)
  const pulls = (await Promise.all(inWindow.map(async (x): Promise<StoresPull | null> => {
    const j = json<Partial<StoresPull>>(await readText('council/ledger/' + x.n))
    return j ? { at: x.t, stem: x.n.replace(/\.json$/, ''), answers: j.answers ?? {}, steps: j.steps ?? [], needs_work: j.needs_work ?? [] } : null
  }))).filter((p): p is StoresPull => !!p)
  const doneFile = json<{ done?: Record<string, unknown> }>(await readText('council/needs-work-done.json'))
  const board = json<BoardData>(await readText('board/board_data.json'))
  const gallery = await import('@/lib/board/gallery')
  const crates: Thing[] = (await gallery.recent(null).catch(() => null))?.cards
    .filter(c => !c.reviewed)
    .map(c => ({ id: 'crate-' + c.sha.slice(0, 16), kind: 'crate' as const, words: c.maker ?? c.round, title: c.title, place: c.round, pic: c.picture })) ?? []
  const first = (await gallery.holes(null).catch(() => null))?.cards[0]
  const hole: StoresHole | null = first ? { id: first.id, title: first.name, words: first.name,
    price: first.price?.dollars ? `About $${first.price.dollars}` : `About ${(first.price?.tokens ?? 0).toLocaleString('en-US')} tokens, no dollars` } : null
  return storesWorldOf({ pulls, board, doneKeys: Object.keys(doneFile?.done ?? {}), placed, now, crates, hole })
}
