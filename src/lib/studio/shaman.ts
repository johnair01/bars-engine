/** The Shaman's loop, loop 1 (/board/studio?shaman=1): the Gourd Star holds all eight pipeline stages as eight rooms
 * round the Hearth (shaman-loop-r1/design.md, with his steers of 2026-10-26: eight unlocked rooms, the room where board
 * work waits is the most charged thing in the scene, a blocked spoke until a room's work lands, every ember opens a
 * card). For each stage the world says whether its work landed this run and which rows wait on it, each row in the
 * board's own words so the card can show it. Read from six-faces-council main like the fleet; pure apart from
 * `loadShaman`. */
import { RUN_MS, pullTime, seedsOf, type Pull, type Stage } from './fleet'

const RAW = 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/'
const LEDGER_API = 'https://api.github.com/repos/wendell-britt/Six-faces-council/contents/council/ledger?ref=main'

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
export type ShamanWorld = {
  rooms: ShamanRoom[]
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
export type StepDoc = { do?: string; text?: string; done?: boolean; deprecated?: boolean; what?: string; at?: string; why?: string }

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
  steps?: Record<string, StepDoc> | null; now?: Date
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
  return { rooms, focus: focusOf(rooms), answered, run: seeds.run, runEnds: seeds.runEnds, at: now.toISOString(), demo: false }
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
 * on his yes, the release that ships). Made up, never read as his data; the page saves nothing in the demo. */
export function demoShaman(now = new Date()): ShamanWorld {
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
  return { rooms, focus: focusOf(rooms), answered: {}, run: landed, runEnds: '', at: now.toISOString(), demo: true }
}

async function text(url: string): Promise<string | null> {
  try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.text() : null } catch { return null }
}
function json<T>(s: string | null): T | null { try { return s ? JSON.parse(s) as T : null } catch { return null } }

let cache: { base: Omit<Parameters<typeof shamanWorldOf>[0], 'steps' | 'now'>; at: number } | null = null

/** The Shaman's world as main has it now (five-minute cache, like the fleet), with the look steps the board store
 * holds. Null when the ledger can't be read; a missing board file or store only leaves those rooms without rows. */
export async function loadShaman(steps: Record<string, StepDoc> | null, now = new Date()): Promise<ShamanWorld | null> {
  if (!cache || now.getTime() - cache.at >= 5 * 60_000) {
    const list = json<{ name: string }[]>(await text(LEDGER_API))
    if (!list) return cache ? shamanWorldOf({ ...cache.base, steps, now }) : null
    const timed = list.map(f => ({ n: f.name, t: pullTime(f.name) })).filter((x): x is { n: string; t: string } => !!x.t)
    const newest = Math.max(0, ...timed.map(x => Date.parse(x.t)))
    const recent = timed.filter(x => newest - Date.parse(x.t) < 7 * RUN_MS)
    const pulls = (await Promise.all(recent.map(async (x): Promise<ShamanPull | null> => {
      const j = json<{ answers?: Pull['answers']; steps?: Pull['steps']; needs_work?: string[] }>(await text(RAW + 'council/ledger/' + x.n))
      return j ? { at: x.t, stem: x.n.replace(/\.json$/, ''), answers: j.answers ?? {}, steps: j.steps ?? [], needs_work: j.needs_work ?? [] } : null
    }))).filter((p): p is ShamanPull => !!p)
    const doneFile = json<{ done?: Record<string, { at?: string }> }>(await text(RAW + 'council/needs-work-done.json'))
    const board = json<BoardData>(await text(RAW + 'board/board_data.json'))
    const doneKeys = Object.keys(doneFile?.done ?? {})
    const builds = Object.values(doneFile?.done ?? {}).map(d => d?.at ?? '').filter(Boolean)
    cache = { base: { board, pulls, doneKeys, builds }, at: now.getTime() }
  }
  return shamanWorldOf({ ...cache!.base, steps, now })
}
