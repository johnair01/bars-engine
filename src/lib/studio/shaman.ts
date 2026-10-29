/** The Shaman's loop, loop 1 (/board/studio?shaman=1): the Gourd Star holds all eight pipeline stages as eight rooms
 * round the Hearth (shaman-loop-r1/design.md, with his steers of 2026-10-26: eight unlocked rooms, the room where board
 * work waits is the most charged thing in the scene, a blocked spoke until a room's work lands, every ember opens a
 * card). For each stage the world says whether its work landed this run and which rows wait on it, each row in the
 * board's own words so the card can show it. Read from six-faces-council main like the fleet; pure apart from
 * `loadShaman`. */
import { RUN_MS, pullTime, seedsOf, type Pull, type Stage } from './fleet'

const RAW = 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/'
const LEDGER_API = 'https://api.github.com/repos/wendell-britt/Six-faces-council/contents/council/ledger?ref=main'
const PULL_RUNS_API = 'https://api.github.com/repos/wendell-britt/Six-faces-council/actions/workflows/board-pull.yml/runs?branch=main&status=completed&per_page=1'

export const STAGES8: Stage[] = ['intake', 'spec', 'falsify', 'plan', 'build', 'verify', 'ship', 'close']
export const MACHINE8: Record<Stage, string> = {
  intake: 'listening bell', spec: 'knot cord', falsify: 'smoke bowl', plan: 'drum',
  build: 'carving bench', verify: 'still pool', ship: 'leaf boat', close: 'planting bed',
}
/** How many waiting rows each room carries to the page (the oldest); the total is sent beside them. */
export const WAIT_CAP = 5

export type RowKind = 'question' | 'position' | 'step' | 'needs-work'
export type Row = {
  id: string; kind: RowKind
  /** The row's own text: a question's q, a position's pos, a step's do, a needs-work item's what. */
  title: string
  why?: string
  options?: { id: string; label: string }[]
  /** Whether his answer on the card is a board save. Needs-work items are crew work and never are. */
  writable: boolean
  /** When the row started waiting, where the record says. */
  at?: string
}
export type ShamanRoom = { stage: Stage; machine: string; landed: boolean; waiting: Row[]; total: number }
/** Where a root blocker comes from, in the order the Hearth takes them: the board store cold, the board pull cold,
 * a blocking step of his, a step that holds two or more open rows (fan-in). */
export type RootSource = 'store' | 'pull' | 'blocking' | 'fan-in'
export const ROOT_ORDER: RootSource[] = ['store', 'pull', 'blocking', 'fan-in']
/** A root blocker: a row of its own, with where it came from and the rooms it holds. A pull root's rooms are the ones
 * holding an ember, which only the page knows, so it is sent with none. `kindled`: he has already said go ahead (or the
 * step carries aiBack), so the crew is relighting it. */
export type Root = Row & { source: RootSource; holds: Stage[]; kindled?: boolean }
/** The Hearth: lit when no root is open, cold while one is, kindling once he has said go ahead on the root. */
export type ShamanHearth = { state: 'lit' | 'cold' | 'kindling'; root: Root | null; queue: Root[] }
export type ShamanWorld = {
  rooms: ShamanRoom[]
  hearth: ShamanHearth
  /** The room whose waiting work is oldest, board work before crew work: the one the hand points at. */
  focus: Stage | null
  /** Ids answered in the fetched board pulls, with the save time main records, so an ember can brighten. */
  answered: Record<string, string>
  run: Stage[]; runEnds: string; at: string; demo: boolean
}

/** The slice of board/board_data.json the loop reads. */
export type BoardData = {
  questions?: { id: string; q?: string; why_you?: string; not_before?: string; options?: { v: string; label?: string }[] }[]
  positions?: { id: string; pos?: string; why?: string; deferred?: boolean }[]
  resolved?: { questions?: Record<string, unknown>; positions?: Record<string, unknown> }
}
/** A ledger pull as the loop reads it: the fleet's Pull, plus its file stem and its needs-work lines. */
export type ShamanPull = Pull & { stem: string; needs_work?: string[] }
/** A step document from the board store (Postgres), by id. */
export type StepDoc = {
  do?: string; text?: string; done?: boolean; deprecated?: boolean; retired?: boolean; what?: string; at?: string; why?: string
  /** A blocking step (the board's blk-): it holds the board until done, withdrawn or handed to Claude. */
  blocking?: boolean
  /** The rows (by id) or rooms (by stage name) this step holds. */
  holds?: string[]
  aiBack?: { text?: string; at?: string } | null
  note?: string
}
/** The board store could not be read (only where a store is configured). */
export type StoreCold = { at: string; why: string }
/** The newest completed board-pull run on main failed. */
export type PullCold = { at: string; url?: string }

/** Which room a needs-work line is the crew's work for: an overrule still being made good is a falsify; a "yes" on a
 * step is a ship; a step laid down for compost is a close; everything else is a build. */
export function needsWorkStage(row: string, what: string): Stage {
  if (row.startsWith('positions/') && /^overruled/i.test(what)) return 'falsify'
  if (row.startsWith('steps/')) {
    if (/^note\s+["“]?\s*yes/i.test(what) || /^yes/i.test(what)) return 'ship'
    if (/^(deprecated|discarded)|compost/i.test(what)) return 'close'
  }
  return 'build'
}

/** An ISO date at the start of a not_before that lies in the future holds the question back; prose never does. */
function heldBack(notBefore: string | undefined, now: Date): boolean {
  const m = (notBefore ?? '').match(/^(\d{4}-\d{2}-\d{2})(T[\d:.]+Z?)?$/)
  return !!m && Date.parse(m[2] ? notBefore! : m[1] + 'T00:00:00Z') > now.getTime()
}

const byAt = (a: Row, b: Row) => (a.at ?? '').localeCompare(b.at ?? '')

export function shamanWorldOf(input: {
  board: BoardData | null; pulls: ShamanPull[]; doneKeys: string[]; builds: string[]
  steps?: Record<string, StepDoc> | null; now?: Date; storeCold?: StoreCold | null; pullCold?: PullCold | null
}): ShamanWorld {
  const now = input.now ?? new Date()
  const answered: Record<string, string> = {}
  for (const p of input.pulls) for (const [id, a] of Object.entries(p.answers ?? {})) {
    const at = (a as { savedAt?: string }).savedAt ?? p.at
    if (!answered[id] || answered[id] < at) answered[id] = at
  }
  for (const p of input.pulls) for (const st of p.steps ?? []) {
    const at = st.at ?? p.at
    if (st.id && (!answered[st.id] || answered[st.id] < at)) answered[st.id] = at
  }
  const wait: Record<Stage, Row[]> = { intake: [], spec: [], falsify: [], plan: [], build: [], verify: [], ship: [], close: [] }
  const b = input.board
  const rq = b?.resolved?.questions ?? {}, rp = b?.resolved?.positions ?? {}
  for (const q of b?.questions ?? []) {
    if (!q?.id || q.id in rq || q.id in answered || heldBack(q.not_before, now)) continue
    const options = (q.options ?? []).filter(o => o && o.v).map(o => ({ id: String(o.v), label: o.label ?? String(o.v) }))
    wait[options.length ? 'plan' : 'intake'].push({ id: q.id, kind: 'question', title: q.q ?? q.id, why: q.why_you, writable: true, ...(options.length ? { options } : {}) })
  }
  for (const p of b?.positions ?? []) {
    if (!p?.id || p.id in rp || p.id in answered || p.deferred) continue
    wait.spec.push({ id: p.id, kind: 'position', title: p.pos ?? p.id, why: p.why, writable: true,
                     options: [{ id: 'stands', label: 'Stands' }, { id: 'overrule', label: 'Overrule' }] })
  }
  const done = new Set(input.doneKeys)
  for (const p of input.pulls) for (const line of p.needs_work ?? []) {
    const i = line.indexOf(': ')
    const row = i < 0 ? line : line.slice(0, i), what = i < 0 ? '' : line.slice(i + 2), key = `${p.stem}#${row}`
    if (done.has(key)) continue
    wait[needsWorkStage(row, what)].push({ id: key, kind: 'needs-work', title: what || row, why: row, writable: false, at: p.at })
  }
  for (const [id, s] of Object.entries(input.steps ?? {})) {
    if (!id.includes('-look-') || !s || s.done === true || s.deprecated === true || s.what === 'deprecated') continue
    wait.verify.push({ id, kind: 'step', title: s.do ?? s.text ?? id, why: s.why, writable: true, at: s.at,
                       options: [{ id: 'yes', label: 'Yes' }] })
  }
  const seeds = seedsOf(input.pulls, input.builds)
  const rooms = STAGES8.map(stage => {
    const all = wait[stage].sort(byAt)
    return { stage, machine: MACHINE8[stage], landed: seeds.run.includes(stage), waiting: all.slice(0, WAIT_CAP), total: all.length }
  })
  const roots = rootsOf({ storeCold: input.storeCold, pullCold: input.pullCold, steps: input.steps, waiting: wait })
  return { rooms, hearth: hearthOf(roots), focus: focusOf(rooms), answered, run: seeds.run, runEnds: seeds.runEnds, at: now.toISOString(), demo: false }
}

const closed = (s: StepDoc) => s.done === true || s.retired === true || s.deprecated === true || s.what === 'deprecated'
const goneAhead = (s: StepDoc) => !!s.aiBack || /^\s*go ahead\b/i.test(s.note ?? '')

/** The root blockers, in the Hearth's order (store, pull, blocking, fan-in; then oldest). `waiting` is every open row
 * by room, before the cap. A blocking step holds the rooms its `holds` names (row ids, looked up to their room, or
 * stage names), or with no `holds` every room with waiting work; a fan-in is an open step whose `holds` names two or
 * more open rows. */
export function rootsOf(input: {
  storeCold?: StoreCold | null; pullCold?: PullCold | null; steps?: Record<string, StepDoc> | null
  waiting: Record<Stage, Row[]>
}): Root[] {
  const out: Root[] = []
  if (input.storeCold) out.push({ id: 'store-cold', kind: 'needs-work', source: 'store', writable: false, at: input.storeCold.at,
    title: 'The board store could not be read, so no card can save.', why: input.storeCold.why, holds: [...STAGES8] })
  if (input.pullCold) out.push({ id: 'pull-cold', kind: 'needs-work', source: 'pull', writable: false, at: input.pullCold.at,
    title: 'The board pull on main failed its last run, so the moves given here are not reaching main.',
    why: 'board-pull.yml' + (input.pullCold.url ? ', ' + input.pullCold.url : ''), holds: [] })
  const roomOf: Record<string, Stage> = {}
  for (const st of STAGES8) for (const r of input.waiting[st]) roomOf[r.id] = st
  const isStage = (x: string): x is Stage => (STAGES8 as string[]).includes(x)
  const steps = Object.entries(input.steps ?? {}).filter(([, s]) => s && !closed(s))
  const row = (id: string, s: StepDoc, source: RootSource, holds: Stage[]): Root => ({
    id, kind: 'step', source, writable: true, title: s.do ?? s.text ?? id, ...(s.why ? { why: s.why } : {}), ...(s.at ? { at: s.at } : {}),
    holds, ...(goneAhead(s) ? { kindled: true } : {}) })
  const uniq = (xs: Stage[]) => STAGES8.filter(st => xs.includes(st))
  const blocking: Root[] = [], fanIn: Root[] = []
  for (const [id, s] of steps) {
    const named = (s.holds ?? []).filter(x => typeof x === 'string')
    if (s.blocking === true) {
      const holds = named.length ? uniq(named.map(x => isStage(x) ? x : roomOf[x]).filter((x): x is Stage => !!x))
        : STAGES8.filter(st => input.waiting[st].length > 0)
      blocking.push(row(id, s, 'blocking', holds))
    } else {
      const open = named.filter(x => roomOf[x])
      if (open.length >= 2) fanIn.push(row(id, s, 'fan-in', uniq(open.map(x => roomOf[x]))))
    }
  }
  return out.concat(blocking.sort(byAt), fanIn.sort(byAt))
}

/** The Hearth from the roots: the first open root wins and the rest are banked beside it. A root he has said go ahead on
 * is kindling, not cold, and only when every root is gone from the data is the Hearth lit. */
export function hearthOf(roots: Root[]): ShamanHearth {
  const open = roots.filter(r => !r.kindled), kindled = roots.filter(r => r.kindled)
  if (open.length) return { state: 'cold', root: open[0], queue: open.slice(1) }
  if (kindled.length) return { state: 'kindling', root: kindled[0], queue: [] }
  return { state: 'lit', root: null, queue: [] }
}

/** The room the hand points at: the oldest waiting board work (writable), else the oldest crew work, else none. */
export function focusOf(rooms: ShamanRoom[]): Stage | null {
  for (const writable of [true, false]) {
    let best: { stage: Stage; at: string } | null = null
    for (const r of rooms) {
      const row = r.waiting.filter(w => w.writable === writable).sort(byAt)[0]
      if (row && (!best || (row.at ?? '') < best.at)) best = { stage: r.stage, at: row.at ?? '' }
    }
    if (best) return best.stage
  }
  return null
}

/** The demo (?shaman=1&demo=1): five rooms landed, ship, close and build waiting, and one row writable (a look waiting
 * on his yes, the release that ships). With `hearth: 'cold'` (&hearth=cold) a blocking demo step holds the leaf boat,
 * the carving bench and the planting bed. Made up, never read as his data; the page saves nothing in the demo. */
export function demoShaman(now = new Date(), o: { hearth?: 'cold' } = {}): ShamanWorld {
  const landed: Stage[] = ['intake', 'spec', 'falsify', 'plan', 'verify']
  const day = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString()
  const rows: Partial<Record<Stage, Row[]>> = {
    ship: [{ id: 'demo-loop-look-2', kind: 'step', writable: true, at: day(30), options: [{ id: 'yes', label: 'Yes' }],
      title: 'Look at the leaf boat set on its channel. A yes releases the work and starts its merge.',
      why: 'Demo row: a look that waits on your yes.' }],
    close: [{ id: 'demo-pull#steps/demo-strand-compost', kind: 'needs-work', writable: false, at: day(20),
      title: 'deprecated: the old strand owes its compost round', why: 'steps/demo-strand-compost' }],
    build: [
      { id: 'demo-pull#questions/demo-carving', kind: 'needs-work', writable: false, at: day(12),
        title: 'Carve the gourd vessel the answer asked for', why: 'questions/demo-carving' },
      { id: 'demo-pull#positions/demo-bench', kind: 'needs-work', writable: false, at: day(10),
        title: 'Stands (steer: "keep the bench low")', why: 'positions/demo-bench' },
    ],
  }
  const rooms = STAGES8.map(stage => {
    const w = rows[stage] ?? []
    return { stage, machine: MACHINE8[stage], landed: landed.includes(stage), waiting: w, total: w.length }
  })
  const steps: Record<string, StepDoc> = o.hearth === 'cold' ? { 'demo-store-restore': { blocking: true, at: day(6),
    do: 'Restore the board store from last night\'s backup, then say go ahead so the crew can bring the rooms back.',
    why: 'Demo row: a blocking step of yours, the root the held rooms wait on.', holds: ['ship', 'build', 'close'] } } : {}
  const wait = Object.fromEntries(rooms.map(r => [r.stage, r.waiting])) as Record<Stage, Row[]>
  const hearth = hearthOf(rootsOf({ steps, waiting: wait }))
  return { rooms, hearth, focus: focusOf(rooms), answered: {}, run: landed, runEnds: '', at: now.toISOString(), demo: true }
}

async function text(url: string): Promise<string | null> {
  try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.text() : null } catch { return null }
}
function json<T>(s: string | null): T | null { try { return s ? JSON.parse(s) as T : null } catch { return null } }

let cache: { base: Omit<Parameters<typeof shamanWorldOf>[0], 'steps' | 'now' | 'storeCold'>; at: number } | null = null

/** Whether the newest completed board-pull run on main failed; a failure to fetch means no root. */
export function pullColdOf(j: { workflow_runs?: { conclusion?: string | null; updated_at?: string; html_url?: string }[] } | null): PullCold | null {
  const run = j?.workflow_runs?.[0]
  return run && run.conclusion === 'failure' ? { at: run.updated_at ?? '', ...(run.html_url ? { url: run.html_url } : {}) } : null
}

/** The Shaman's world as main has it now (five-minute cache, like the fleet), with the steps the board store holds.
 * Null when the ledger can't be read; a missing board file or store only leaves those rooms without rows. `storeCold`
 * is set by the route when a configured store fails, and holds the Hearth. */
export async function loadShaman(steps: Record<string, StepDoc> | null, now = new Date(), storeCold: StoreCold | null = null): Promise<ShamanWorld | null> {
  if (!cache || now.getTime() - cache.at >= 5 * 60_000) {
    const list = json<{ name: string }[]>(await text(LEDGER_API))
    if (!list) return cache ? shamanWorldOf({ ...cache.base, steps, now, storeCold }) : null
    const timed = list.map(f => ({ n: f.name, t: pullTime(f.name) })).filter((x): x is { n: string; t: string } => !!x.t)
    const newest = Math.max(0, ...timed.map(x => Date.parse(x.t)))
    const recent = timed.filter(x => newest - Date.parse(x.t) < 7 * RUN_MS)
    const pulls = (await Promise.all(recent.map(async (x): Promise<ShamanPull | null> => {
      const j = json<{ answers?: Pull['answers']; steps?: Pull['steps']; needs_work?: string[] }>(await text(RAW + 'council/ledger/' + x.n))
      return j ? { at: x.t, stem: x.n.replace(/\.json$/, ''), answers: j.answers ?? {}, steps: j.steps ?? [], needs_work: j.needs_work ?? [] } : null
    }))).filter((p): p is ShamanPull => !!p)
    const doneFile = json<{ done?: Record<string, { at?: string }> }>(await text(RAW + 'council/needs-work-done.json'))
    const board = json<BoardData>(await text(RAW + 'board/board_data.json'))
    const pullCold = pullColdOf(json(await text(PULL_RUNS_API)))
    const doneKeys = Object.keys(doneFile?.done ?? {})
    const builds = Object.values(doneFile?.done ?? {}).map(d => d?.at ?? '').filter(Boolean)
    cache = { base: { board, pulls, doneKeys, builds, pullCold }, at: now.getTime() }
  }
  return shamanWorldOf({ ...cache!.base, steps, now, storeCold })
}
