/** The face ships fleet (studio-lot rounds 7 to 9, council #397): the pipeline's eight rooms on six ships, each room
 * named by its machine. During a run a room whose work lands sends up one learning (a cream seed) to the store at the
 * Hearth; nothing on a ship changes mid-run. At the orientation intake the seeds are spent: one deepens a room by a
 * rung, and more can pay for the next hull (boat-grid-learnings-are-seeds). The work is read from the board's own
 * ledger on six-faces-council main, so the seeds are his real answers. Pure apart from `loadFleet`. */
import { listNames, readText } from '@/lib/board/content-store'

export type Stage = 'intake' | 'spec' | 'falsify' | 'plan' | 'build' | 'verify' | 'ship' | 'close'
export type Room = { stage: Stage; machine: string; rung: number }
export type Ship = { id: string; name: string; face: string; rooms: Room[]; hull: number }

/** Round 7's table (gameplay-loop-r7.md), with round 9's rungs: the loom orange, the foundry red, the star chart
 * magenta, every other room an apprentice's strip. Every hull starts at the first class. Rungs and hulls stay as
 * authored until a played intake is stored. */
export const SHIPS: Ship[] = [
  { id: 'gourd-star', name: 'Gourd Star', face: 'shaman', hull: 1, rooms: [{ stage: 'intake', machine: 'listening bell', rung: 1 }] },
  { id: 'orrery', name: 'Clockwork Orrery', face: 'architect', hull: 1, rooms: [
    { stage: 'spec', machine: 'loom', rung: 4 }, { stage: 'build', machine: 'foundry', rung: 2 }, { stage: 'plan', machine: 'star chart', rung: 1 }] },
  { id: 'ember-comet', name: 'Ember Comet', face: 'challenger', hull: 1, rooms: [{ stage: 'falsify', machine: 'forge', rung: 1 }] },
  { id: 'twin-lantern', name: 'Twin Lantern', face: 'diplomat', hull: 1, rooms: [{ stage: 'verify', machine: 'mirror pool', rung: 1 }] },
  { id: 'jade-palace', name: 'Jade Palace', face: 'regent', hull: 1, rooms: [{ stage: 'ship', machine: 'launch cradle', rung: 1 }] },
  { id: 'seed-archive', name: 'Seed Archive', face: 'sage', hull: 1, rooms: [{ stage: 'close', machine: 'stores', rung: 1 }] },
]

/** How a ship may grow (his overrule of boat-grid-hull-all-rooms: "Share of the rooms. Ships need constraints for how
 * they grow and how big a ship a player can have"). Position boat-grid-growth-limits. */
export const GROWTH = {
  /** The next hull opens when this share of the ship's rooms, rounded up, stand at its rung or higher. */
  share: 2 / 3,
  /** A hull is paid for in seeds at the intake: as many seeds as the class it opens. */
  costPerClass: 1,
  /** One hull step per intake at most. */
  stepsPerIntake: 1,
  /** No ship more than this many classes ahead of the smallest ship in the fleet. */
  aheadOfFleet: 1,
  /** The largest hull: one class per altitude in faces.yaml, teal last. */
  maxHull: 6,
  /** The store at the Hearth holds this many seeds; a seed past it goes back to the compost tide. */
  storeCap: 7,
}

/** One board answer, as board/pull.py records it in council/ledger/<date>-pull-<time>.json. */
export type Answer = { kind?: string; status?: string; choice?: string }
export type Pull = { at: string; answers: Record<string, Answer>; steps: { id?: string; at?: string; what?: string; note?: string }[] }

/** Which room an answer of his is the landed work of. A position he lets stand is a spec that held (loom); a pick is a
 * course set (star chart); a look ticked is a verify (mirror pool); an overrule or a look sent back is a falsify
 * (forge); a note on a question is a new ask in his words (bell). Builds (foundry) come from needs-work items done.
 * The Shaman's loop adds two (position shaman-loop-ship-close-data): his "yes" note on a step is a release (ship), and
 * a step laid down as deprecated is a close, and so is a thing placed in the Stores' move (stores.ts). */
export function stagesOf(p: Pull): Stage[] {
  const out: Stage[] = []
  for (const a of Object.values(p.answers ?? {})) {
    if (a.kind === 'position') out.push(a.status === 'overrule' ? 'falsify' : 'spec')
    else if (a.kind === 'question') out.push(a.choice === 'note' ? 'intake' : 'plan')
  }
  for (const s of p.steps ?? []) {
    if (s.what === 'ticked') out.push('verify')
    else if (s.what === 'deprecated' || s.what === 'stores') out.push('close')
    else if (/^\s*yes\b/i.test(s.note ?? '')) out.push('ship')
    else out.push('falsify')
  }
  return out
}

/** A run is the day of work up to the newest board pull; the six days before it are earlier runs. */
export const RUN_MS = 24 * 3_600_000
export type Seeds = { run: Stage[]; earlier: Stage[][]; runEnds: string }

/** A room sends up one seed a run however much of its work lands, so the store fills by rooms, not by volume. */
export function seedsOf(pulls: Pull[], builds: string[]): Seeds {
  const times = [...pulls.map(p => Date.parse(p.at)), ...builds.map(b => Date.parse(b))].filter(t => !Number.isNaN(t))
  const end = times.length ? Math.max(...times) : 0
  const runs = new Map<number, Set<Stage>>()
  const add = (t: number, s: Stage) => {
    const n = Math.floor((end - t) / RUN_MS)
    if (n < 0 || n > 6) return
    if (!runs.has(n)) runs.set(n, new Set())
    runs.get(n)!.add(s)
  }
  for (const p of pulls) for (const s of stagesOf(p)) add(Date.parse(p.at), s)
  for (const b of builds) add(Date.parse(b), 'build')
  const earlier = [...runs].filter(([n]) => n > 0).sort((a, b) => a[0] - b[0]).map(([, set]) => [...set].sort())
  return { run: [...(runs.get(0) ?? [])].sort(), earlier, runEnds: end ? new Date(end).toISOString() : '' }
}

export function hullRung(hull: number): number { return hull + 1 }

/** Rooms that stand at the next hull's rung, and how many the share asks for. */
export function shareOf(ship: Ship): { at: number; need: number } {
  const rung = hullRung(ship.hull)
  return { at: ship.rooms.filter(r => r.rung >= rung).length, need: Math.ceil(ship.rooms.length * GROWTH.share) }
}

export type Intake = {
  /** The room the seed is spent on: the lowest, the one holding the ship back. */
  spend: Stage | null
  /** The ship after the spend. */
  ship: Ship
  /** Whether the larger hull opens this intake, and what it cost. */
  opens: boolean; cost: number
  /** Why it stayed shut, when it did. */
  held: 'share' | 'seeds' | 'fleet' | 'max' | null
  left: number
}

/** The orientation intake the autoplay performs: spend one seed on the ship's lowest room, then open the next hull if
 * the share stands there, the seeds left pay for it, and the fleet and the ceiling allow it. */
export function intakeOf(ship: Ship, fleet: Ship[], seeds: number): Intake {
  const rooms = ship.rooms.map(r => ({ ...r }))
  let left = seeds, spend: Stage | null = null
  const low = rooms.reduce<Room | null>((m, r) => (!m || r.rung < m.rung ? r : m), null)
  if (low && left > 0 && low.rung < GROWTH.maxHull) { low.rung += 1; left -= 1; spend = low.stage }
  const after = { ...ship, rooms }
  const cost = (ship.hull + 1) * GROWTH.costPerClass
  const smallest = Math.min(...fleet.map(s => s.hull))
  const s = shareOf(after)
  const held = ship.hull >= GROWTH.maxHull ? 'max'
    : s.at < s.need ? 'share'
    : ship.hull + 1 - smallest > GROWTH.aheadOfFleet ? 'fleet'
    : left < cost ? 'seeds' : null
  const opens = held === null
  if (opens) { after.hull = ship.hull + 1; left -= cost }
  return { spend, ship: after, opens, cost: opens ? cost : 0, held, left }
}

/** What the Orrery's loop shows, from the real seeds. The store carries earlier runs' seeds up to its size, after
 * this run's; every seed past it went back to the tide. */
export type OrreryWorld = {
  landed: { loom: boolean; foundry: boolean; chart: boolean }
  carried: number; spent: boolean; opens: boolean; cost: number; held: Intake['held']
  run: Stage[]; runEnds: string; at: string
}

/** How many seeds a ship brings to its intake: one for each of its rooms whose work landed this run, and what earlier
 * runs left in its store, capped at the store's size after this run's seeds. */
export function storeOf(ship: Ship, seeds: Seeds): { landed: number; carried: number } {
  const mine = new Set(ship.rooms.map(r => r.stage))
  const landed = seeds.run.filter(s => mine.has(s)).length
  const before = seeds.earlier.reduce((n, run) => n + run.filter(s => mine.has(s)).length, 0)
  return { landed, carried: Math.max(0, Math.min(GROWTH.storeCap - landed, before)) }
}

export function orreryOf(seeds: Seeds, now = new Date(), fleet: Ship[] = SHIPS): OrreryWorld {
  const ship = fleet.find(s => s.id === 'orrery')!
  const { landed: landedN, carried } = storeOf(ship, seeds)
  const i = intakeOf(ship, fleet, carried + landedN)
  return {
    landed: { loom: seeds.run.includes('spec'), foundry: seeds.run.includes('build'), chart: seeds.run.includes('plan') },
    carried, spent: i.spend === 'plan', opens: i.opens, cost: i.cost, held: i.held, run: seeds.run, runEnds: seeds.runEnds,
    at: now.toISOString(),
  }
}

/** What one ship's loop shows, for any ship: its rooms at their rungs and whether each one's work landed this run, its
 * store, and what its intake does when run against the whole fleet (so the fleet rule can hold it). */
export type ShipWorld = {
  id: string; name: string; face: string; hull: number
  rooms: { stage: Stage; machine: string; rung: number; landed: boolean }[]
  carried: number; landed: number
  spend: Stage | null; spent: boolean; opens: boolean; cost: number; held: Intake['held']
  /** The ship after its intake: its hull class and each room's rung, in room order. */
  after: { hull: number; rungs: number[] }
}

export function shipWorldOf(id: string, seeds: Seeds, fleet: Ship[] = SHIPS): ShipWorld {
  const ship = fleet.find(s => s.id === id)
  if (!ship) throw new Error(`no ship ${id}`)
  const { landed, carried } = storeOf(ship, seeds)
  const i = intakeOf(ship, fleet, carried + landed)
  return {
    id: ship.id, name: ship.name, face: ship.face, hull: ship.hull,
    rooms: ship.rooms.map(r => ({ stage: r.stage, machine: r.machine, rung: r.rung, landed: seeds.run.includes(r.stage) })),
    carried, landed, spend: i.spend, spent: i.spend !== null, opens: i.opens, cost: i.cost, held: i.held,
    after: { hull: i.ship.hull, rungs: i.ship.rooms.map(r => r.rung) },
  }
}

/** The whole fleet's world: every ship's intake run against the fleet as it stood before the intake, so a ship more
 * than one class ahead of the smallest ship is held (GROWTH.aheadOfFleet). The Orrery's own loop keeps its world. */
export type FleetWorld = { ships: ShipWorld[]; orrery: OrreryWorld; smallest: number; run: Stage[]; runEnds: string; at: string }

export function fleetOf(seeds: Seeds, fleet: Ship[] = SHIPS, now = new Date()): FleetWorld {
  return {
    ships: fleet.map(s => shipWorldOf(s.id, seeds, fleet)),
    orrery: orreryOf(seeds, now, fleet),
    smallest: Math.min(...fleet.map(s => s.hull)),
    run: seeds.run, runEnds: seeds.runEnds, at: now.toISOString(),
  }
}

/** The fleet's demo (?demo=1): round 9's Orrery world, and the Ember Comet a class up from an earlier intake, so its
 * next hull is held by the fleet rule while the Gourd Star is still at the first class. Never read as his data. */
export const DEMO_SHIPS: Ship[] = SHIPS.map(s => s.id === 'ember-comet'
  ? { ...s, hull: 2, rooms: s.rooms.map(r => ({ ...r, rung: 4 })) } : s)
export const DEMO_SEEDS: Seeds = {
  run: ['build', 'close', 'falsify', 'intake', 'plan', 'spec', 'verify'],
  earlier: [['build', 'falsify', 'plan', 'spec', 'verify'], ['falsify', 'verify'], ['falsify']],
  runEnds: '',
}
export function demoFleet(now = new Date()): FleetWorld { return fleetOf(DEMO_SEEDS, DEMO_SHIPS, now) }

/** `2026-10-25-pull-014112.json` -> 2026-10-25T01:41:12Z (board/pull.py names its records in UTC). */
export function pullTime(name: string): string | null {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})-pull-(\d{2})(\d{2})(\d{2})\.json$/)
  return m ? `${m[1]}T${m[2]}:${m[3]}:${m[4]}Z` : null
}

let cache: { world: FleetWorld; at: number } | null = null

/** The fleet's world as main has it now, cached five minutes like the boards. Null when the ledger can't be read. */
export async function loadFleet(now = new Date()): Promise<FleetWorld | null> {
  if (cache && now.getTime() - cache.at < 5 * 60_000) return cache.world
  const names = await listNames('council/ledger/')
  if (!names.length) return cache?.world ?? null
  const timed = names.map(n => ({ n, t: pullTime(n) })).filter((x): x is { n: string; t: string } => !!x.t)
  const newest = Math.max(0, ...timed.map(x => Date.parse(x.t)))
  const recent = timed.filter(x => newest - Date.parse(x.t) < 7 * RUN_MS)
  const pulls = (await Promise.all(recent.map(async x => {
    const body = await readText('council/ledger/' + x.n)
    try { const j = body ? JSON.parse(body) : null; return j ? { at: x.t, answers: j.answers ?? {}, steps: j.steps ?? [] } as Pull : null } catch { return null }
  }))).filter((p): p is Pull => !!p)
  const done = await readText('council/needs-work-done.json')
  let builds: string[] = []
  try { builds = Object.values((done ? JSON.parse(done) : {}).done ?? {}).map(d => (d as { at?: string }).at ?? '').filter(Boolean) } catch { /* none */ }
  const world = fleetOf(seedsOf(pulls, builds), SHIPS, now)
  cache = { world, at: now.getTime() }
  return world
}
