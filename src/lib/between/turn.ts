import { COST, cardsOf } from '../../../public/between/friendcraft/deck.js'
import type { Doc } from './rules'

/**
 * A turn at the Between's low table (Six-faces-council spec .specify/specs/friendcraft-deck-2). Pure: every state move is
 * here so each road is tested without a database. Only `POST /api/between/[gardenId]/turn` writes a turn, and a sealed
 * card's words stay in its owner's homeroom until it opens (FR-004): `move` copies them in only on the move that opens it.
 */

export const LINE_MAX = 140
export type Card = { goal: string; depth: 'light' | 'middle' | 'deep'; words: string; goalText: string }
export type Verdict = { ok: true; turn: Doc; spend: 'add' | 'remove' | null; slip: boolean; kept: boolean } | { ok: false; status: number; error: string }

const isObj = (v: unknown): v is Doc => !!v && typeof v === 'object' && !Array.isArray(v)
const bad = (status: number, error: string): Verdict => ({ ok: false, status, error })

/** Every card of an owner's deck that has words, in a fixed order (goal id, then depth) so a seeded draw replays. */
export function worded(deck: Doc | null | undefined): Card[] {
  const goals = isObj(deck) && isObj(deck.goals) ? deck.goals : {}
  const out: Card[] = []
  for (const gid of Object.keys(goals).sort()) {
    const g = goals[gid]
    if (!isObj(g) || typeof g.text !== 'string' || !g.text) continue
    for (const c of cardsOf(g)) out.push({ goal: gid, depth: c.depth as Card['depth'], words: c.words, goalText: g.text })
  }
  return out
}

/** Statuses of a turn that keep its card on the table, so it is not drawn a second time. */
const ON_TABLE = new Set(['open', 'sealed', 'asked', 'waiting', 'opened'])
/** A drawer holds the next draw while a card they drew lies in the middle, face up or still sealed and undecided. */
const HOLDS_DRAW = new Set(['open', 'sealed'])

/** mulberry32: a small seeded draw, so a turn replays from the seed it saved (deck-draw). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The drawer draws one card from the owner's deck. `turns` are the Between's turn items. Returns the new turn, face up
 * when the card is light and sealed (no words) otherwise, or the sentence that says why not.
 */
export function draw(deck: Doc | null, drawer: string, owner: string, ownerName: string, turns: Doc[], seed: number, at: number): { ok: true; turn: Doc } | { ok: false; status: number; error: string } {
  if (turns.some(t => t.kind === 'turn' && t.by === drawer && HOLDS_DRAW.has(t.status as string)))
    return { ok: false, status: 409, error: 'Finish the card on the table first.' }
  const taken = new Set(turns.filter(t => t.kind === 'turn' && t.owner === owner && ON_TABLE.has(t.status as string)).map(t => t.goal + '/' + t.depth))
  const cards = worded(deck).filter(c => !taken.has(c.goal + '/' + c.depth))
  if (!cards.length) return { ok: false, status: 409, error: `${ownerName}'s deck has no card to draw just now.` }
  const c = cards[Math.floor(seeded(seed)() * cards.length)]
  const base: Doc = { kind: 'turn', by: drawer, owner, goal: c.goal, depth: c.depth, seed, lines: {}, at }
  if (c.depth === 'light') return { ok: true, turn: { ...base, status: 'open', words: c.words, goalText: c.goalText } }
  return { ok: true, turn: { ...base, status: 'sealed' } }
}

const MOVES = ['ask', 'earn', 'open', 'offer', 'notToday', 'back', 'line'] as const
export type TurnMove = (typeof MOVES)[number]
export const isMove = (v: unknown): v is TurnMove => (MOVES as readonly string[]).includes(v as string)

const lineText = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '')

/**
 * One move on a turn by `who`. `bowlsNow` is the tea on the table before this move; `card` is the owner's card words, read
 * by the server, and only used on a move that opens the card. A refusal is one plain sentence. A card that goes back or is
 * sent away returns any tea it took (`spend: 'remove'`); tea that opens a card is a `spend: 'add'`.
 */
export function move(turn: Doc, act: TurnMove, who: string, ownerName: string, bowlsNow: number, card: Card | null, words: unknown, at: number): Verdict {
  const drawer = turn.by as string, owner = turn.owner as string
  const status = turn.status as string
  const depth = turn.depth as 'light' | 'middle' | 'deep'
  const only = (name: boolean) => `Only ${name ? ownerName : 'the one who drew it'} can do that.`
  const wrongState = bad(409, 'That card is not at that place on the table now.')
  const keep = (t: Doc, extra: Partial<Extract<Verdict, { ok: true }>> = {}): Verdict => ({ ok: true, turn: t, spend: null, slip: false, kept: false, ...extra })
  const opened = (): Doc | null => (!card || card.goal !== turn.goal || card.depth !== depth ? null : { ...turn, status: 'open', words: card.words, goalText: card.goalText })
  switch (act) {
    case 'ask':
      if (who !== drawer) return bad(403, only(false))
      if (status !== 'sealed') return wrongState
      return keep({ ...turn, status: 'asked' }, { slip: true })
    case 'earn':
      if (who !== drawer) return bad(403, only(false))
      if (status !== 'sealed') return wrongState
      return keep({ ...turn, status: 'waiting' })
    case 'open': {
      if (who !== drawer) return bad(403, only(false))
      if (status !== 'waiting') return wrongState
      const cost = COST[depth] as number
      if (bowlsNow < cost) return bad(409, 'There is not tea enough on the table yet.')
      return keep({ ...turn, status: 'opened' }, { spend: 'add' })
    }
    case 'offer': {
      if (who !== owner) return bad(403, `Only ${ownerName} can offer a card they wrote.`)
      if (status !== 'asked' && status !== 'opened') return wrongState
      const t = opened()
      return t ? keep(t) : bad(409, 'That card is no longer in the deck.')
    }
    case 'notToday':
      if (who !== owner) return bad(403, `Only ${ownerName} can say not today to a card they wrote.`)
      if (status !== 'asked' && status !== 'opened') return wrongState
      return keep({ ...turn, status: 'notToday' }, { spend: status === 'opened' ? 'remove' : null })
    case 'back':
      if (who !== drawer) return bad(403, only(false))
      if (!['sealed', 'asked', 'waiting', 'opened'].includes(status)) return wrongState
      return keep({ ...turn, status: 'back' }, { spend: status === 'opened' ? 'remove' : null })
    case 'line': {
      if (who !== drawer && who !== owner) return bad(403, 'Only the two friends at this table write a line.')
      if (status !== 'open') return wrongState
      const w = lineText(words)
      if (!w || w.length > LINE_MAX || /[<>]/.test(w)) return bad(400, 'A line is a few words of your own, one hundred and forty letters at most.')
      const lines = isObj(turn.lines) ? turn.lines : {}
      if (who === owner && !isObj(lines[drawer])) return bad(409, 'Wait for the first line before you write yours.')
      const next: Doc = { ...turn, lines: { ...lines, [who]: { words: w, at } } }
      const both = isObj(next.lines) && isObj((next.lines as Doc)[drawer]) && isObj((next.lines as Doc)[owner])
      if (!both) return keep(next)
      return keep({ ...next, status: 'kept', keptAt: at }, { kept: true })
    }
  }
}

/** What a member may see of a turn: the same item, with the card's words only once it is open (FR-004). */
export function seen(turn: Doc): Doc {
  if (['open', 'kept'].includes(turn.status as string)) return turn
  const { words: _w, goalText: _g, ...rest } = turn
  return rest
}

/**
 * The card an owner is being asked for, as only the owner sees it: her own words and goal, read from her own deck on the
 * server and added to the poll for her alone (`forYou`), never stored on the turn and never sent to the drawer. Null when
 * the turn is not waiting on her or the card is no longer in her deck.
 */
export function forYou(turn: Doc, me: string, deck: Doc | null): { words: string; goalText: string } | null {
  if (turn.kind !== 'turn' || turn.owner !== me || (turn.status !== 'asked' && turn.status !== 'opened')) return null
  const c = worded(deck).find(x => x.goal === turn.goal && x.depth === turn.depth)
  return c ? { words: c.words, goalText: c.goalText } : null
}
