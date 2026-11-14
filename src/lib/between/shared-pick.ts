/**
 * Letters from the nook (Six-faces-council hollow-interface rounds 3 and 4; positions hi3-letters-from-the-nook,
 * hi3-card-goes-once, hi4-obstacle-from-the-draw, hi4-overcome-becomes-story). This replaces the shared draft of
 * ch1-shared-pick: nobody takes a card from anybody. Each player sends one Wake Up card from their own hand, from their
 * own nook, as a letter; the server keeps each letter sealed until both are in and then opens them together. The two
 * cards draw the obstacle; each player presses one step of their own card, sealed the same way until every step the try
 * waits on is in. When every part has given, the server keeps the overcome obstacle as a named story in the garden doc.
 * A card sent at A6 stays in the Between, so it cannot be sent again at A8 (a card goes once a chapter).
 *
 * garden.letters = { v: 2, order: [opener, partner],
 *   a6: { sent: { uid: { card, at } }, tries: { "1": { uid: { i, at } } } }, a8: { ... },
 *   stories: { a6: { name, cards, at } } }
 * Pure, so rules.ts, the page and the invite check all run the same rule. The lines live in
 * public/between/encounter-lines.js, read by the page too.
 */

import type { Doc, Json, Verdict } from './rules'
import { HAND, ORDER, currentEncounter, encounterState } from '../../../public/between/encounter-lines.js'

/** The A8 card each hand may keep in its own pouch (rules.ts pouchWrite, sp-hollow-card-is-own). */
export const HOLLOW_CARD = 'WAKE-RA-CHALLENGER'

/**
 * A5's keepsake: the home face's Raise Awareness card, or that face's Direct Action card when the Raise Awareness one is
 * already in the hand (Shaman's at A4, Challenger's at A8). encounters.yaml `a5_card`; the hand stays seven cards.
 */
export const FACES = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const
export function keepsakeFor(face: string | null | undefined): string {
  const f = (FACES as readonly string[]).includes(face ?? '') ? face!.toUpperCase() : 'SAGE'
  return f === 'SHAMAN' || f === 'CHALLENGER' ? `WAKE-DA-${f}` : `WAKE-RA-${f}`
}
/** The seven-card Chapter 1 hand (ch1-deck-hand), in the order the beats deal it. The lines are written for the Sage's keepsake. */
export function chapter1Hand(face?: string | null): string[] {
  return ['WAKE-GR-SHAMAN', 'WAKE-GR-SAGE', 'WAKE-RA-SHAMAN', keepsakeFor(face), 'WAKE-DA-REGENT', 'WAKE-DA-DIPLOMAT', 'WAKE-RA-CHALLENGER']
}

const isObj = (v: unknown): v is Doc => !!v && typeof v === 'object' && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const no = (status: number, error: string): Verdict => ({ ok: false, status, error })
const yes: Verdict = { ok: true }
const obj = (v: Json | undefined): Doc => (isObj(v) ? v : {})
/** JSON with sorted keys, so two docs built in different orders compare equal. */
const canon = (v: Json | undefined): string =>
  v === undefined || v === null ? 'null' : Array.isArray(v) ? `[${v.map(canon).join(',')}]`
    : isObj(v) ? `{${Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',')}}` : JSON.stringify(v)
const same = (a: Json | undefined, b: Json | undefined) => canon(a) === canon(b)
const members = (g: Doc) => (isObj(g.members) ? Object.keys(g.members) : [])

/** A fresh letters doc for a garden of two, the opener first. Null for a garden of one, which keeps its dealt hand. */
export function openLetters(garden: Doc): Doc | null {
  const ms = members(garden), opener = garden.startedBy as string
  if (ms.length !== 2 || !ms.includes(opener) || garden.kind === 'home') return null
  return { v: 2, order: [opener, ms.find(m => m !== opener)!], a6: { sent: {}, tries: {} }, a8: { sent: {}, tries: {} }, stories: {} }
}

/** The cards `me` has sent this chapter, at any encounter. */
export const sentBy = (L: Doc, me: string) =>
  ORDER.map(e => obj(obj(obj(L[e]).sent)[me]).card).filter((c): c is string => typeof c === 'string')

const entryOk = (e: Json | undefined, keys: string[]) => isObj(e) && Object.keys(e).length === keys.length && keys.every(k => k in e) && isNum(e.at)

/**
 * May `me` move the letters from `cur` (the garden's now, or none) to `next` (after the page's merge)? A write does one
 * thing: open the letters for a garden of two, seal my letter at the encounter the pair is at, or press my step in the
 * try that waits on me. The stories are the server's to keep (`settle`), never the page's.
 */
export function lettersWrite(me: string, garden: Doc, cur: Json | undefined, next: Json): Verdict {
  if (!isObj(next)) return no(400, 'Letters are a small thing.')
  if (!isObj(cur)) {
    const fresh = openLetters(garden)
    if (!fresh) return no(400, 'Letters need the two of you in the garden.')
    return same(next, fresh) ? yes : no(400, 'The letters open with the one who started the garden first, and nothing sent.')
  }
  const order = (cur.order as string[]) || []
  if (!order.includes(me)) return no(403, 'These letters are between the two of them.')
  if (!same(next.stories, cur.stories) || !same(next.order, cur.order) || next.v !== cur.v) return no(400, 'The stories are the Between\'s to keep, and the order does not change.')
  const enc = currentEncounter(cur)
  if (enc === 'done') return no(409, 'The chapter is over.')
  for (const e of ORDER) if (e !== enc && !same(next[e], cur[e])) return no(409, `The two of you are at ${enc === 'a6' ? 'Pip\'s floor' : 'the hollow'} now.`)
  const E = obj(cur[enc]), sent = obj(E.sent)
  const st = encounterState(cur, enc)
  const nE = obj(next[enc]), nSent = obj(nE.sent)
  for (const u of order) if (u !== me && !same(nSent[u], sent[u])) return no(403, 'That letter is the other person\'s own.')
  // sealing my letter
  if (!isObj(sent[me]) && isObj(nSent[me])) {
    const l = nSent[me] as Doc
    if (!entryOk(l, ['card', 'at'])) return no(400, 'A letter carries one card and when it was sent.')
    const card = l.card as string
    if (!HAND.includes(card)) return no(400, 'Send one of the seven cards of your hand.')
    if (sentBy(cur, me).includes(card)) return no(409, 'That card is already in the Between. Each card goes once a chapter.')
    const want = { ...cur, [enc]: { ...E, sent: { ...sent, [me]: l } } }
    return same(next, want) ? yes : no(400, 'A letter is sent on its own.')
  }
  if (isObj(sent[me]) && !same(nSent[me], sent[me])) return no(409, 'Your letter is already in the Between. One card each, each encounter.')
  // pressing my step
  if (!st.both) return no(409, 'The letters are not both in yet.')
  if (st.overcome) return no(409, 'This one is overcome already.')
  const k = String(st.try), t = obj(obj(E.tries)[k]), nT = obj(obj(nE.tries)[k])
  if (!isObj(nT[me]) || isObj(t[me])) return no(400, 'A write sends a letter or takes a step, one at a time.')
  if (!st.need.includes(me)) return no(409, 'Your part has given. Your partner is taking their step.')
  const s = nT[me] as Doc
  if (!entryOk(s, ['i', 'at']) || ![0, 1, 2].includes(s.i as number)) return no(400, 'Take one of your card\'s three steps.')
  const want = { ...cur, [enc]: { ...E, tries: { ...obj(E.tries), [k]: { ...t, [me]: s } } } }
  return same(next, want) ? yes : no(400, 'A step is taken on its own.')
}

/** After a write: when every part has given, keep the story. The server runs this, so neither page writes a story. */
export function settle(L: Doc, at = Date.now()): Doc {
  const enc = currentEncounter(L)
  if (enc === 'done') return L
  const st = encounterState(L, enc)
  if (!st.overcome) return L
  return { ...L, stories: { ...obj(L.stories), [enc]: { name: st.story, cards: st.cards as string[], at } } }
}

/**
 * The letters as `me` sees them: the other's letter sealed (no card) until both are in, and the other's step sealed (no
 * step) until every step the try waits on is in. So the server, not the page, opens them together.
 */
export function viewLetters(L: Json | undefined, me: string): Json | undefined {
  if (!isObj(L)) return L
  const out: Doc = { ...L }
  for (const enc of ORDER) {
    const E = obj(L[enc]), sent = obj(E.sent), st = encounterState(L, enc)
    if (!st.both) out[enc] = { ...E, sent: Object.fromEntries(Object.entries(sent).map(([u, l]) => [u, u === me ? l : { sealed: true, at: obj(l).at ?? null }])) }
    else if (st.try != null) {
      const k = String(st.try), t = obj(obj(E.tries)[k])
      out[enc] = { ...E, tries: { ...obj(E.tries), [k]: Object.fromEntries(Object.entries(t).map(([u, s]) => [u, u === me ? s : { sealed: true, at: obj(s).at ?? null }])) } }
    }
  }
  return out
}
/** The garden doc as `me` sees it. */
export const viewGarden = (g: Doc, me: string): Doc => ('letters' in g ? { ...g, letters: viewLetters(g.letters, me) as Json } : g)
