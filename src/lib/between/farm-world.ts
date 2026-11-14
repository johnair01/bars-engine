/**
 * The farm's world data, the part an agent may change (six-faces-council .specify/specs/farm-world-write).
 *
 * The farm doc (`farm.ts`) is the player's own save: the grid, the mana, the plants. This file is a second doc,
 * BetweenPrivate key "farm-world" on the same homeroom, that an agent writes through the board MCP so a player's
 * capture changes the place without a deploy. It is a separate key on purpose: the player's every act reads and
 * rewrites the whole farm doc, and an agent write inside it would be lost to the next act.
 *
 * The line (Wendell, ntw-tier-look-1, A: "Data at once, rules to me"). DATA is something the running page already
 * draws: a labeled seed on a slot, a note on a slot, a small object from the list below. An agent applies it at once and
 * logs it. A RULE is anything that changes how the farm plays or needs code: mana, costs, days to grow, the grid, a
 * new act, a new kind of object. A rule request is refused here, kept on the capture as "not yet" with its reason,
 * and goes to Wendell as one board row. Pure: no database, so a test clock and a test farm run it as it is.
 */
import { SLOTS } from './farm'

/** What the page draws today. Adding a name here needs the matching mesh in public/between/farm/farm.js, so it is code. */
export const OBJECTS = ['lantern', 'bench', 'stone', 'flowers', 'scarecrow'] as const
export type WorldObject = (typeof OBJECTS)[number]
export const DATA_KINDS = ['seed', 'note', 'object'] as const
export type DataKind = (typeof DATA_KINDS)[number]

export const SIGN_MAX = 60 // a seed's label
export const NOTE_MAX = 280
export const MAX_CHANGES = 40

export type Change = {
  id: string
  slot: number
  kind: DataKind
  text: string
  object: WorldObject | null
  /** The capture (BAR or backlog item) the change answers; the jar on the shelf opens on it. */
  captureId: string
  /** Pictures of the place before and after, as board or Blob links. The after is added when the change has been shot. */
  before: string | null
  after: string | null
  lane: string
  at: string
  status: 'applied' | 'reverted'
}
export type NotYet = { id: string; captureId: string; slot: number | null; ask: string; why: string; lane: string; at: string }
export type WorldDoc = { changes: Change[]; notYet: NotYet[]; log: { at: string; lane: string; did: string }[] }

export const newWorld = (): WorldDoc => ({ changes: [], notYet: [], log: [] })

export type Input = {
  slot?: unknown; kind?: unknown; text?: unknown; object?: unknown; captureId?: unknown
  before?: unknown; lane?: unknown; ask?: unknown
}
export type Outcome =
  | { ok: true; tier: 'data'; doc: WorldDoc; change: Change }
  | { ok: false; tier: 'rule'; doc: WorldDoc; notYet: NotYet; why: string }
  | { ok: false; tier: 'invalid'; why: string }

const clean = (s: unknown, max: number) =>
  typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : ''
const link = (v: unknown) => (typeof v === 'string' && /^https:\/\/[^\s]{1,400}$/.test(v) ? v : null)
const inGrid = (i: unknown): i is number => Number.isInteger(i) && (i as number) >= 0 && (i as number) < SLOTS
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const stamp = (n: number) => n.toString(36)

/** Kinds a capture can ask for that change how the farm plays. Named so the refusal can say why, in the player's words. */
const RULE_WORDS: [RegExp, string][] = [
  [/mana|cost|price|vibeulon|harvest/i, 'it changes what things cost or give'],
  [/day|grow|weed|water|till|plant|ripen/i, 'it changes how plants grow'],
  [/grid|row|column|field|fence|gate|portal|stream/i, 'it changes the shape of the land'],
  [/tool|shed|hoe|act|button|rule|mechanic/i, 'it needs a new tool or a new rule'],
]

/**
 * One agent change. A data kind with valid fields is applied at once. Anything else that names a farm rule is kept as a
 * not-yet with its reason (the jar says it kindly and specifically, and never names an agent). A malformed data change is
 * `invalid`: nothing is kept and the caller fixes the call.
 */
export function change(doc: WorldDoc, input: Input, now: string): Outcome {
  const lane = clean(input.lane, 40) || 'agent'
  const captureId = clean(input.captureId, 120)
  if (!captureId) return { ok: false, tier: 'invalid', why: 'Every change answers a capture: name captureId' }
  // A seed carries the words a signpost used to carry; `sign` is still accepted and means the same seed.
  const kind = input.kind === 'sign' ? 'seed' : input.kind
  const isData = typeof kind === 'string' && (DATA_KINDS as readonly string[]).includes(kind)

  if (!isData) {
    const ask = clean(input.ask ?? input.text ?? kind, 280)
    if (!ask) return { ok: false, tier: 'invalid', why: `kind is one of ${DATA_KINDS.join(', ')}, or send ask for a rule request` }
    const why = RULE_WORDS.find(([re]) => re.test(ask))?.[1] ?? 'it is not a seed, a note or one of the farm\'s objects'
    const w = clone(doc)
    if (w.notYet.length >= MAX_CHANGES) return { ok: false, tier: 'invalid', why: 'Too many open requests on this farm' }
    const notYet: NotYet = { id: `ny-${stamp(Date.parse(now))}-${w.notYet.length}`, captureId, slot: inGrid(input.slot) ? input.slot : null, ask, why, lane, at: now }
    w.notYet.push(notYet)
    w.log.push({ at: now, lane, did: `not yet (${why}): ${ask}` })
    return { ok: false, tier: 'rule', doc: w, notYet, why }
  }

  if (!inGrid(input.slot)) return { ok: false, tier: 'invalid', why: `slot is a whole number from 0 to ${SLOTS - 1}` }
  const k = kind as DataKind
  let text = ''
  let object: WorldObject | null = null
  if (k === 'seed') text = clean(input.text, SIGN_MAX)
  if (k === 'note') text = clean(input.text, NOTE_MAX)
  if (k === 'object') {
    if (typeof input.object !== 'string' || !(OBJECTS as readonly string[]).includes(input.object))
      return { ok: false as const, tier: 'rule' as const, ...ruleFor(doc, input, now, lane, captureId, `an object called "${clean(input.object, 40)}"`, 'the farm has no such object yet; a new one needs a new drawing') }
    object = input.object as WorldObject
    text = clean(input.text, SIGN_MAX)
  }
  if ((k === 'seed' || k === 'note') && !text) return { ok: false, tier: 'invalid', why: `a ${k} needs its words in text` }

  const w = clone(doc)
  const live = w.changes.filter(c => c.status === 'applied')
  if (live.length >= MAX_CHANGES) return { ok: false, tier: 'invalid', why: 'This farm already holds the most changes it can show' }
  // One seed per slot: a second seed replaces the first, so the place never shows two voices at once.
  if (k === 'seed') for (const c of w.changes) if (c.slot === input.slot && c.kind === 'seed' && c.status === 'applied') c.status = 'reverted'
  const c: Change = {
    id: `chg-${stamp(Date.parse(now))}-${w.changes.length}`, slot: input.slot, kind: k, text, object, captureId,
    before: link(input.before), after: null, lane, at: now, status: 'applied',
  }
  w.changes.push(c)
  w.log.push({ at: now, lane, did: `${k} on slot ${input.slot}${object ? ` (${object})` : ''}${text ? `: ${text}` : ''}` })
  return { ok: true, tier: 'data', doc: w, change: c }
}

function ruleFor(doc: WorldDoc, input: Input, now: string, lane: string, captureId: string, ask: string, why: string) {
  const w = clone(doc)
  const notYet: NotYet = { id: `ny-${stamp(Date.parse(now))}-${w.notYet.length}`, captureId, slot: inGrid(input.slot) ? input.slot : null, ask, why, lane, at: now }
  w.notYet.push(notYet)
  w.log.push({ at: now, lane, did: `not yet (${why}): ${ask}` })
  return { doc: w, notYet, why }
}

/** Attach the after-picture once the changed place has been shot, so the jar can show the pair. */
export function attachAfter(doc: WorldDoc, id: string, after: unknown, now: string): { ok: boolean; doc: WorldDoc; why?: string } {
  const url = link(after)
  if (!url) return { ok: false, doc, why: 'after is an https link to the picture' }
  const w = clone(doc)
  const c = w.changes.find(x => x.id === id)
  if (!c) return { ok: false, doc, why: 'No such change' }
  c.after = url
  w.log.push({ at: now, lane: c.lane, did: `after picture on ${id}` })
  return { ok: true, doc: w }
}

/** Take a change back. The record stays; the page stops drawing it. */
export function revert(doc: WorldDoc, id: string, lane: string, now: string): { ok: boolean; doc: WorldDoc; why?: string } {
  const w = clone(doc)
  const c = w.changes.find(x => x.id === id)
  if (!c) return { ok: false, doc, why: 'No such change' }
  if (c.status === 'reverted') return { ok: true, doc }
  c.status = 'reverted'
  w.log.push({ at: now, lane: clean(lane, 40) || 'agent', did: `reverted ${id}` })
  return { ok: true, doc: w }
}

/** Read whatever the store holds into a well-formed doc. */
export function asWorld(raw: unknown): WorldDoc {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Partial<WorldDoc>) : {}
  return {
    changes: Array.isArray(r.changes) ? r.changes : [],
    notYet: Array.isArray(r.notYet) ? r.notYet : [],
    log: Array.isArray(r.log) ? r.log.slice(-200) : [],
  }
}

/** What the player's page gets: applied changes and the not-yets, never the agent's lane or the log. */
export function forPlayer(doc: WorldDoc) {
  return {
    changes: doc.changes.filter(c => c.status === 'applied').map(({ lane: _l, ...c }) => c),
    notYet: doc.notYet.map(({ lane: _l, ...n }) => n),
  }
}
