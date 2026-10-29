/**
 * The shared pick at Chapter 1's hunters' choice (A6) and the hollow (A8): two players in one garden take turns lifting
 * Wake Up cards from one pool of seven, so each pick shrinks what the other can play (Six-faces-council feature
 * ch1-shared-pick, .specify/specs/ch1-shared-pick/; atlas allocation-public-pick and allocation-snake-order, ontology
 * TurnsAndSharedPool). Pure, so rules.ts, the page and the invite check all run the same turn rule.
 *
 * garden.pick = { v: 1, order: [opener, partner], moment, turn, pool, taken: { card: {by, moment, at} }, passed: [..], own: [..] }
 * A6: the opener picks for the whole, then the partner for the hunters. A8 reverses: the partner first, then the opener.
 * At A8 each hand may lift its own hollow card instead of a pool card (sp-hollow-card-is-own): that card goes to the
 * player's private pouch, and the shared doc records only that a turn was taken from their own hollow, never which card.
 * A pass is always a valid turn. A garden with one member never opens a pool (sp-alone-keeps-the-hand).
 */

import type { Doc, Json, Verdict } from './rules'

export const MOMENTS = ['a6-whole', 'a6-hunters', 'a8-hollow'] as const
export type Moment = (typeof MOMENTS)[number]

/** The card written for each moment (sprout campaigns/mtgoa-ch1/encounters.yaml `hand`), which the end screen scores against. */
export const WRITTEN: Record<Moment, string> = {
  'a6-whole': 'WAKE-DA-REGENT',
  'a6-hunters': 'WAKE-DA-DIPLOMAT',
  'a8-hollow': 'WAKE-RA-CHALLENGER',
}

/** Each hand's own hollow card: the A8 card, drawn from its own hollow and kept private. */
export const HOLLOW_CARD = WRITTEN['a8-hollow']

/**
 * A5's keepsake: the home face's Raise Awareness card, or that face's Direct Action card when the Raise Awareness one is
 * already in the hand (Shaman's at A4, Challenger's at A8). encounters.yaml `a5_card`; the hand stays seven cards.
 */
export const FACES = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const
export function keepsakeFor(face: string | null | undefined): string {
  const f = (FACES as readonly string[]).includes(face ?? '') ? face!.toUpperCase() : 'SAGE'
  return f === 'SHAMAN' || f === 'CHALLENGER' ? `WAKE-DA-${f}` : `WAKE-RA-${f}`
}

/** The seven-card Chapter 1 hand (ch1-deck-hand), in the order the beats deal it: A2, A3, A4, A5, A6 twice, A8. */
export function chapter1Hand(face?: string | null): string[] {
  return ['WAKE-GR-SHAMAN', 'WAKE-GR-SAGE', 'WAKE-RA-SHAMAN', keepsakeFor(face), 'WAKE-DA-REGENT', 'WAKE-DA-DIPLOMAT', 'WAKE-RA-CHALLENGER']
}

/** The turns in order: who picks at each moment. A8 runs the A6 order reversed. */
export function turns(order: string[]): { moment: Moment; by: string }[] {
  const [a, b] = order
  return [{ moment: 'a6-whole', by: a }, { moment: 'a6-hunters', by: b }, { moment: 'a8-hollow', by: b }, { moment: 'a8-hollow', by: a }]
}

const isObj = (v: unknown): v is Doc => !!v && typeof v === 'object' && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const no = (status: number, error: string): Verdict => ({ ok: false, status, error })
const yes: Verdict = { ok: true }
const WAKE = /^WAKE-(GR|RA|DA|SO)-(SHAMAN|CHALLENGER|REGENT|ARCHITECT|DIPLOMAT|SAGE)$/

const list = (v: Json | undefined): Doc[] => (Array.isArray(v) ? (v.filter(isObj) as Doc[]) : [])
/** How many turns have been taken: a card lifted from the pool, a pass, or a lift from one's own hollow. */
export const turnsTaken = (p: Doc) => Object.keys(isObj(p.taken) ? p.taken : {}).length + list(p.passed).length + list(p.own).length

/** Who picks now and at which moment, from the turns taken; `done` once all four are. */
export function nextTurn(p: Doc): { moment: Moment | 'done'; turn: string | null } {
  const t = turns(p.order as string[])[turnsTaken(p)]
  return t ? { moment: t.moment, turn: t.by } : { moment: 'done', turn: null }
}

const members = (g: Doc) => (isObj(g.members) ? Object.keys(g.members) : [])

/** A new pool for a garden of two: the opener first. Null for a garden of one, which keeps its dealt hand. */
export function openPick(garden: Doc, face?: string | null): Doc | null {
  const ms = members(garden), opener = garden.startedBy as string
  if (ms.length !== 2 || !ms.includes(opener) || garden.kind === 'home') return null
  const order = [opener, ms.find(m => m !== opener)!]
  return { v: 1, order, moment: 'a6-whole', turn: opener, pool: chapter1Hand(face), taken: {}, passed: [], own: [] }
}

const same = (a: Json | undefined, b: Json | undefined) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const entryOk = (e: Json | undefined, me: string, moment: Json) =>
  isObj(e) && Object.keys(e).every(k => k === 'by' || k === 'moment' || k === 'at') && e.by === me && e.moment === moment && isNum(e.at)

/**
 * May `me` move the pick from `cur` (the garden's pick now, or none) to `next` (after the page's merge)? Only the hand
 * whose turn it is writes, one turn at a time; a card leaves the pool only once, and the pool only shrinks (FR-004).
 */
export function pickWrite(me: string, garden: Doc, cur: Json | undefined, next: Json): Verdict {
  if (next === null) return !isObj(cur) || cur.moment === 'done' ? yes : no(409, 'The pick is still going. Finish it first.')
  if (!isObj(next)) return no(400, 'A pick is a small thing.')
  for (const k of Object.keys(next))
    if (!['v', 'order', 'moment', 'turn', 'pool', 'taken', 'passed', 'own'].includes(k)) return no(400, 'A pick keeps whose turn it is and what is left, nothing more.')
  if (!isObj(cur)) {
    const fresh = openPick(garden)
    if (!fresh) return no(400, 'A shared pick needs the two of you in the garden.')
    const pool = next.pool
    if (!Array.isArray(pool) || pool.length !== 7 || new Set(pool).size !== 7 || !pool.every(c => typeof c === 'string' && WAKE.test(c)))
      return no(400, 'The pool is the seven Wake Up cards of the hand.')
    if (!same(next.order, fresh.order) || next.moment !== 'a6-whole' || next.turn !== fresh.turn || !same(next.taken, {}) || !same(next.passed, []) || !same(next.own, []) || next.v !== 1)
      return no(400, 'A pick opens with the one who started the garden choosing first.')
    return yes
  }
  if (cur.moment === 'done') return no(409, 'The pick is over.')
  if (cur.turn !== me) return no(409, 'It is their pick.')
  if (!same(next.order, cur.order) || next.v !== cur.v) return no(400, 'The order of the pick does not change.')
  const curTaken = isObj(cur.taken) ? cur.taken : {}, nextTaken = isObj(next.taken) ? next.taken : {}
  for (const [c, e] of Object.entries(curTaken)) if (!same(nextTaken[c], e)) return no(409, 'That card has already been lifted.')
  if (turnsTaken(next) !== turnsTaken(cur) + 1) return no(400, 'One turn at a time.')
  for (const f of ['passed', 'own'] as const)
    if (!same(list(next[f]).slice(0, list(cur[f]).length), list(cur[f]))) return no(400, 'A turn taken stays taken.')
  const pool = Array.isArray(cur.pool) ? (cur.pool as string[]) : []
  const added = Object.keys(nextTaken).filter(c => !(c in curTaken))
  if (added.length) {
    const c = added[0]
    if (!pool.includes(c)) return no(409, 'That card has already been lifted.')
    if (!entryOk(nextTaken[c], me, cur.moment)) return no(400, 'A pick names who lifted it, when, and nothing more.')
    if (!same(next.pool, pool.filter(x => x !== c))) return no(400, 'A lifted card leaves the pool, and only that one.')
  } else {
    const f = list(next.passed).length > list(cur.passed).length ? 'passed' : 'own'
    if (!entryOk(list(next[f]).at(-1), me, cur.moment)) return no(400, 'A turn names who took it, when, and nothing more.')
    if (f === 'own' && cur.moment !== 'a8-hollow') return no(400, 'Only the hollow has a card of your own.')
    if (!same(next.pool, pool)) return no(400, 'A pass leaves the pool as it was.')
  }
  const want = nextTurn(next)
  if (next.moment !== want.moment || next.turn !== want.turn) return no(400, 'The turn passes in order.')
  return yes
}

/** The page's next pick after `me` takes a turn: lift `card` from the pool, lift their own hollow card, or pass. */
export function takeTurn(p: Doc, me: string, act: { lift: string } | { own: true } | { pass: true }, at = Date.now()): Doc {
  const entry = { by: me, moment: p.moment as Json, at }
  const out: Doc = { ...p, taken: { ...(isObj(p.taken) ? p.taken : {}) }, passed: [...list(p.passed)], own: [...list(p.own)] }
  if ('lift' in act) { (out.taken as Doc)[act.lift] = entry; out.pool = (p.pool as string[]).filter(c => c !== act.lift) }
  else if ('own' in act) (out.own as Doc[]).push(entry)
  else (out.passed as Doc[]).push(entry)
  return { ...out, ...nextTurn(out) }
}

/**
 * The end screen's log (FR-006): for each hand, what it played at each moment and the card written for it. Another
 * hand's lift from its own hollow shows as `own` with no card, since that card is theirs alone.
 */
export function pickLog(p: Doc, me: string): { by: string; moment: Moment; card: string | null; own: boolean; passed: boolean; written: string; fit: boolean }[] {
  const out: ReturnType<typeof pickLog> = []
  const taken = isObj(p.taken) ? p.taken : {}
  for (const t of turns(p.order as string[])) {
    const lift = Object.entries(taken).find(([, e]) => isObj(e) && e.by === t.by && e.moment === t.moment)
    const own = list(p.own).some(e => e.by === t.by && e.moment === t.moment)
    const passed = list(p.passed).some(e => e.by === t.by && e.moment === t.moment)
    if (!lift && !own && !passed) continue
    const card = lift ? lift[0] : own && t.by === me ? HOLLOW_CARD : null
    out.push({ by: t.by, moment: t.moment, card, own, passed, written: WRITTEN[t.moment], fit: lift ? lift[0] === WRITTEN[t.moment] : own })
  }
  return out
}
