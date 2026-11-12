/**
 * The constraint read's shape: what a valid snapshot is, what the 200 body is, and what a lane token may see.
 *
 * The read itself is computed in six-faces-council (`council/tools/constraint.py`) and arrives as a pushed document.
 * This file only checks it and narrows it, and it stays pure on purpose: no db, no `next`, so
 * `npx tsx src/lib/council/__tests__/constraint.test.ts` runs it without a server or a database.
 *
 * Contract and the reasoning: six-faces-council `docs/specs/constraint-route-brief.md`.
 */
export type Lane = {
  key: string
  label: string
  face: string
  port: string
  wip: number
  oldest_hours: number
  oldest_days: number
  age_weighted: number
  project: string
  source: string
}

export type Move = {
  text: string
  lane: string
  cost_min: number
  expects: { asks: number; builds: number; dollars: number }
  value: number
  leverage: number
  why: string
  missing: string | null
  face: string
  source: string
}

export type Ranked = { text: string; lane: string; cost_min: number; leverage: number }

export type ConstraintSnapshot = {
  as_of: string
  weights: { asks: number; builds: number; dollars_per_hundred: number }
  unit: string
  constraint: Lane
  why_this_lane: string
  lanes: Lane[]
  move: Move
  then: Ranked[]
  falsifier: string
  /** The card the council drew for this snapshot, when it pushed one. Never one of the JSON keys. */
  card_html?: string
}

/** The keys a 200 body carries, in the order `read()` returns them. A key outside this list never leaves the server. */
export const READ_KEYS = ['as_of', 'weights', 'unit', 'constraint', 'why_this_lane', 'lanes', 'move', 'then',
  'falsifier'] as const

export const DATE = /^\d{4}-\d{2}-\d{2}$/

/** A date that exists. 2026-02-30 matches the pattern and is not a day, so it is not filed under one. */
export function isRealDate(s: string): boolean {
  if (!DATE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function laneOf(v: unknown): Lane | null {
  if (!isObj(v)) return null
  const { key, label, face, port, project, source } = v
  const { wip, oldest_hours, oldest_days, age_weighted } = v
  if (typeof key !== 'string' || typeof label !== 'string' || typeof face !== 'string' || typeof port !== 'string' ||
      typeof project !== 'string' || typeof source !== 'string') return null
  if (!isNum(wip) || !isNum(oldest_hours) || !isNum(oldest_days) || !isNum(age_weighted)) return null
  return { key, label, face, port, wip, oldest_hours, oldest_days, age_weighted, project, source }
}

function moveOf(v: unknown, lanes: Lane[]): Move | null {
  if (!isObj(v)) return null
  const { text, lane, cost_min, expects, value, leverage, why, missing, face, source } = v
  if (typeof text !== 'string' || typeof lane !== 'string' || typeof why !== 'string') return null
  if (typeof face !== 'string' || typeof source !== 'string') return null
  if (!isNum(cost_min) || !isNum(value) || !isNum(leverage)) return null
  if (!isObj(expects)) return null
  const { asks, builds, dollars } = expects
  if (!isNum(asks) || !isNum(builds) || !isNum(dollars)) return null
  if (missing !== undefined && missing !== null && typeof missing !== 'string') return null
  // A move aimed at a lane the snapshot does not carry is a broken snapshot, not a move on a new lane.
  if (!lanes.some((l) => l.key === lane)) return null
  return { text, lane, cost_min, expects: { asks, builds, dollars }, value, leverage, why,
           missing: typeof missing === 'string' ? missing : null, face, source }
}

function rankedOf(v: unknown): Ranked | null {
  if (!isObj(v)) return null
  const { text, lane, cost_min, leverage } = v
  if (typeof text !== 'string' || typeof lane !== 'string' || !isNum(cost_min) || !isNum(leverage)) return null
  return { text, lane, cost_min, leverage }
}

/**
 * A snapshot is refused whole or served whole. Weights that do not sum to 1.0, a move naming a lane that is not there,
 * or a lane missing a field all mean the read was computed against a store this one does not hold, and half a read is
 * worse than none.
 */
export function checkSnapshot(v: unknown): { ok: true; snapshot: ConstraintSnapshot } | { ok: false; error: string } {
  if (!isObj(v)) return { ok: false, error: 'snapshot is not an object' }
  if (typeof v.as_of !== 'string' || !isRealDate(v.as_of)) return { ok: false, error: 'as_of is not a real date' }
  if (typeof v.unit !== 'string' || typeof v.why_this_lane !== 'string' || typeof v.falsifier !== 'string') {
    return { ok: false, error: 'a sentence is missing' }
  }
  if (!isObj(v.weights)) return { ok: false, error: 'weights is not an object' }
  const { asks, builds, dollars_per_hundred } = v.weights
  if (!isNum(asks) || !isNum(builds) || !isNum(dollars_per_hundred)) return { ok: false, error: 'weights is missing a number' }
  const sum = asks + builds + dollars_per_hundred
  if (Math.abs(sum - 1) > 0.001) return { ok: false, error: `weights sum to ${sum}, not 1.0` }
  if (!Array.isArray(v.lanes) || v.lanes.length === 0) return { ok: false, error: 'no lanes' }
  const lanes: Lane[] = []
  for (const raw of v.lanes) {
    const lane = laneOf(raw)
    if (!lane) return { ok: false, error: 'a lane is missing a field' }
    lanes.push(lane)
  }
  const constraint = laneOf(v.constraint)
  if (!constraint) return { ok: false, error: 'constraint is not a lane' }
  const move = moveOf(v.move, lanes)
  if (!move) return { ok: false, error: 'the move names a lane that is not in lanes, or is missing a field' }
  if (!Array.isArray(v.then)) return { ok: false, error: 'then is not a list' }
  const then: Ranked[] = []
  for (const raw of v.then) {
    const ranked = rankedOf(raw)
    if (!ranked) return { ok: false, error: 'a ranked move is missing a field' }
    then.push(ranked)
  }
  if (v.card_html !== undefined && typeof v.card_html !== 'string') return { ok: false, error: 'card_html is not a string' }
  return {
    ok: true,
    snapshot: { as_of: v.as_of, weights: { asks, builds, dollars_per_hundred }, unit: v.unit, constraint,
                why_this_lane: v.why_this_lane, lanes, move, then, falsifier: v.falsifier,
                ...(typeof v.card_html === 'string' ? { card_html: v.card_html } : {}) },
  }
}

/** The 200 body: those keys and no others, so a field the store happens to carry never rides along. */
export function shape(s: ConstraintSnapshot): Record<string, unknown> {
  return { as_of: s.as_of, weights: s.weights, unit: s.unit, constraint: s.constraint,
           why_this_lane: s.why_this_lane, lanes: s.lanes, move: s.move, then: s.then, falsifier: s.falsifier }
}

/**
 * A lane token sees its own lane and the constraint, and every other lane only as a count. Counts travel; names and
 * numbers do not. An unknown lane returns null, because a configuration that disagrees with the data must not widen.
 */
export function scoped(s: ConstraintSnapshot, lane: string): Record<string, unknown> | null {
  if (!s.lanes.some((l) => l.key === lane)) return null
  const visible = s.lanes.filter((l) => l.key === lane || l.key === s.constraint.key)
  return {
    ...shape(s),
    lanes: visible,
    then: s.then.filter((t) => t.lane === lane || t.lane === s.constraint.key),
    lanes_hidden: s.lanes.length - visible.length,
  }
}

/**
 * CONSTRAINT_LANE_TOKENS is JSON, token to the one lane that token owns, one entry per client. A malformed map reads as
 * empty and `loud` says why, so a typo closes the door instead of opening it. The token text never appears in a log.
 */
export function laneTokens(raw: string | undefined): { tokens: Record<string, string>; loud: string[] } {
  const loud: string[] = []
  if (!raw) return { tokens: {}, loud }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { tokens: {}, loud: ['CONSTRAINT_LANE_TOKENS does not parse; no lane tokens are open'] }
  }
  if (!isObj(parsed)) return { tokens: {}, loud: ['CONSTRAINT_LANE_TOKENS is not an object; no lane tokens are open'] }
  const tokens: Record<string, string> = {}
  for (const [token, lane] of Object.entries(parsed)) {
    if (typeof lane !== 'string' || !lane) {
      loud.push('a lane token names no lane; that entry is ignored')
      continue
    }
    tokens[token] = lane
  }
  return { tokens, loud }
}
