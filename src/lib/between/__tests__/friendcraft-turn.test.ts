import { describe, expect, it } from 'vitest'
// The state moves of a turn (Six-faces-council spec friendcraft-deck-2 FR-003 to FR-008) and the doc route's refusal (FR-002).
import { draw, forYou, move, seen, worded, type Card } from '../turn'
import { mayWrite, roomSummary, type Doc } from '../rules'
import { bowls } from '../../../../public/between/growth.js'
import { COPY, HINTS } from '../../../../public/between/friendcraft/deck.js'

const deck: Doc = { goals: {
  g1: { text: 'A friend who asks how I am', at: 1, cards: { light: { words: 'Text me on a slow day', at: 1 }, deep: { words: 'Sit with me when I cry', at: 1 } } },
  g2: { text: 'Someone to walk with', at: 2, cards: { middle: { words: 'Walk the long way home', at: 2 } } },
} }
const only = (g: string, d: string): Doc => ({ goals: { [g]: { ...(deck.goals as any)[g], cards: { [d]: (deck.goals as any)[g].cards[d] } } } })
const sealed = (depth = 'deep'): Doc => ({ kind: 'turn', by: 'D', owner: 'O', goal: 'g1', depth, status: 'sealed', seed: 1, lines: {}, at: 1 })
const card: Card = { goal: 'g1', depth: 'deep', words: 'Sit with me when I cry', goalText: 'A friend who asks how I am' }
const ok = (v: any) => { if (!v.ok) throw new Error(v.error); return v }

describe('draw', () => {
  it('draws a light card face up with its words, and a deeper one sealed without them', () => {
    const light = ok(draw(only('g1', 'light'), 'D', 'O', 'Mara', [], 7, 10))
    expect(light.turn).toMatchObject({ status: 'open', words: 'Text me on a slow day', depth: 'light', seed: 7 })
    const deep = ok(draw(only('g1', 'deep'), 'D', 'O', 'Mara', [], 7, 10))
    expect(deep.turn.status).toBe('sealed')
    expect(JSON.stringify(deep.turn)).not.toContain('cry')
    expect(deep.turn.goalText).toBeUndefined()
  })
  it('replays from its seed and skips a card already on the table', () => {
    const a = ok(draw(deck, 'D', 'O', 'Mara', [], 99, 1)).turn, b = ok(draw(deck, 'D', 'O', 'Mara', [], 99, 2)).turn
    expect([a.goal, a.depth]).toEqual([b.goal, b.depth])
    const onTable = [{ kind: 'turn', by: 'X', owner: 'O', goal: 'g1', depth: 'light', status: 'open' }, { kind: 'turn', by: 'X', owner: 'O', goal: 'g1', depth: 'deep', status: 'asked' }]
    for (let s = 0; s < 20; s++) expect(ok(draw(deck, 'D', 'O', 'Mara', onTable, s, 1)).turn).toMatchObject({ goal: 'g2', depth: 'middle' })
  })
  it('holds the next draw only while a card is face up or sealed, not once it is set aside', () => {
    expect(draw(deck, 'D', 'O', 'Mara', [sealed()], 1, 1)).toMatchObject({ ok: false, status: 409 })
    expect(draw(deck, 'D', 'O', 'Mara', [{ ...sealed(), status: 'asked' }], 1, 1).ok).toBe(true)
    expect(draw(deck, 'D', 'O', 'Mara', [{ ...sealed(), status: 'waiting' }], 1, 1).ok).toBe(true)
  })
  it('says so plainly when there is no worded card left', () => {
    expect(draw({ goals: {} }, 'D', 'O', 'Mara', [], 1, 1)).toEqual({ ok: false, status: 409, error: "Mara's deck has no card to draw just now." })
    expect(worded({ goals: { g: { text: 'x', at: 1, cards: { light: null } } } })).toEqual([])
  })
})

describe('the three roads', () => {
  it('asking costs nothing, leaves a slip, and only the owner can offer it open', () => {
    const asked = ok(move(sealed(), 'ask', 'D', 'Mara', 0, null, null, 2))
    expect(asked.turn.status).toBe('asked'); expect(asked.slip).toBe(true); expect(asked.spend).toBeNull()
    expect(move(asked.turn, 'offer', 'D', 'Mara', 0, card, null, 3)).toMatchObject({ ok: false, status: 403, error: 'Only Mara can offer a card they wrote.' })
    const open = ok(move(asked.turn, 'offer', 'O', 'Mara', 0, card, null, 3))
    expect(open.turn).toMatchObject({ status: 'open', words: 'Sit with me when I cry', goalText: 'A friend who asks how I am' }); expect(open.spend).toBeNull()
  })
  it('tea opens a card only when the table has the bowls, writes one spend, and waits on the owner', () => {
    const waiting = ok(move(sealed(), 'earn', 'D', 'Mara', 0, null, null, 2)).turn
    expect(move(waiting, 'open', 'D', 'Mara', 1, null, null, 3)).toMatchObject({ ok: false, status: 409 })
    const opened = ok(move(waiting, 'open', 'D', 'Mara', 2, null, null, 3))
    expect(opened.turn.status).toBe('opened'); expect(opened.spend).toBe('add')
    expect(opened.turn.words).toBeUndefined()
    expect(ok(move(opened.turn, 'offer', 'O', 'Mara', 0, card, null, 4)).turn.status).toBe('open')
  })
  it('not today after tea sends the card away and the tea comes back', () => {
    const items: Record<string, any> = { a: { kind: 'turn', status: 'kept', keptAt: 1, by: 'D', owner: 'O' }, b: { kind: 'turn', status: 'kept', keptAt: 2, by: 'D', owner: 'O' } }
    const waiting = ok(move(sealed(), 'earn', 'D', 'Mara', 2, null, null, 2)).turn
    const opened = ok(move(waiting, 'open', 'D', 'Mara', bowls(items), null, null, 3))
    items.s = { kind: 'spend', by: 'D', turn: 't', bowls: 2 }
    expect(bowls(items)).toBe(0)
    const no = ok(move(opened.turn, 'notToday', 'O', 'Mara', 0, null, null, 4))
    expect(no.turn.status).toBe('notToday'); expect(no.spend).toBe('remove')
    delete items.s
    expect(bowls(items)).toBe(2)
    expect(move(opened.turn, 'notToday', 'D', 'Mara', 0, null, null, 4)).toMatchObject({ ok: false, status: 403 })
  })
  it('putting it back is the drawer\'s, free, and returns any tea', () => {
    expect(ok(move(sealed(), 'back', 'D', 'Mara', 0, null, null, 2)).turn.status).toBe('back')
    expect(move(sealed(), 'back', 'O', 'Mara', 0, null, null, 2)).toMatchObject({ ok: false, status: 403 })
    const opened = { ...sealed(), status: 'opened' }
    expect(ok(move(opened, 'back', 'D', 'Mara', 0, null, null, 2)).spend).toBe('remove')
    expect(move({ ...sealed(), status: 'open' }, 'back', 'D', 'Mara', 0, null, null, 2)).toMatchObject({ ok: false, status: 409 })
  })
})

describe('lines and the kept turn', () => {
  const open: Doc = { ...sealed(), status: 'open', words: 'Sit with me when I cry', goalText: 'A friend who asks how I am' }
  it('takes the drawer\'s line first, then the owner\'s, and keeps the turn when the second lands', () => {
    expect(move(open, 'line', 'O', 'Mara', 0, null, 'me too', 2)).toMatchObject({ ok: false, status: 409 })
    const one = ok(move(open, 'line', 'D', 'Mara', 0, null, '  I will come.  ', 2))
    expect(one.kept).toBe(false); expect((one.turn.lines as any).D.words).toBe('I will come.')
    const rewritten = ok(move(one.turn, 'line', 'D', 'Mara', 0, null, 'I will come at once.', 3))
    expect((rewritten.turn.lines as any).D.words).toBe('I will come at once.')
    const two = ok(move(rewritten.turn, 'line', 'O', 'Mara', 0, null, 'Thank you.', 4))
    expect(two.kept).toBe(true); expect(two.turn).toMatchObject({ status: 'kept', keptAt: 4 })
    expect(move(two.turn, 'line', 'D', 'Mara', 0, null, 'again', 5)).toMatchObject({ ok: false, status: 409 })
  })
  it('refuses an empty line, a long one and a stranger', () => {
    expect(move(open, 'line', 'D', 'Mara', 0, null, '   ', 2)).toMatchObject({ ok: false, status: 400 })
    expect(move(open, 'line', 'D', 'Mara', 0, null, 'x'.repeat(141), 2)).toMatchObject({ ok: false, status: 400 })
    expect(move(open, 'line', 'Z', 'Mara', 0, null, 'hi', 2)).toMatchObject({ ok: false, status: 403 })
  })
})

describe('words stay home until a card opens', () => {
  it('seen() drops the words of a card that is not open, and the room summary names ids only', () => {
    const leaky = { ...sealed(), status: 'asked', words: 'SECRET', goalText: 'SECRET' }
    expect(JSON.stringify(seen(leaky))).not.toContain('SECRET')
    const sum = roomSummary('O', 'r', { members: { D: {}, O: {} } }, [{ id: 't1', data: { ...sealed(), status: 'asked' } }])
    expect(sum.waiting).toEqual([{ id: 't1', what: 'turn' }])
    expect(JSON.stringify(sum)).not.toContain('cry')
    expect(roomSummary('D', 'r', { members: { D: {}, O: {} } }, [{ id: 't1', data: { ...sealed(), status: 'asked' } }]).waiting).toEqual([])
  })
})

describe('forYou: the owner sees her own asked card', () => {
  it('gives the words only to the owner, only while the card waits on her', () => {
    expect(forYou({ ...sealed(), status: 'asked' }, 'O', deck)).toEqual({ words: 'Sit with me when I cry', goalText: 'A friend who asks how I am' })
    expect(forYou({ ...sealed(), status: 'asked' }, 'D', deck)).toBeNull()
    expect(forYou(sealed(), 'O', deck)).toBeNull()
    expect(forYou({ ...sealed(), status: 'kept' }, 'O', deck)).toBeNull()
    expect(forYou({ ...sealed(), status: 'asked', goal: 'gone' }, 'O', deck)).toBeNull()
  })
})

describe('the doc route', () => {
  const who = { playerId: 'D', member: true, invited: false }
  const garden: Doc = { members: { D: {}, O: {} }, kind: 'room' }
  it('refuses to set, update or delete a turn or a spend', () => {
    for (const kind of ['turn', 'spend']) {
      expect(mayWrite(who, garden, { table: 'items', id: 'x' }, 'set', { kind, by: 'D' }, null)).toEqual({ ok: false, status: 403, error: 'A turn is played at the table.' })
      expect(mayWrite(who, garden, { table: 'items', id: 'x' }, 'update', { status: 'kept' }, { kind, by: 'D' })).toMatchObject({ ok: false, status: 403 })
      expect(mayWrite(who, garden, { table: 'items', id: 'x' }, 'delete', null, { kind, by: 'D' })).toMatchObject({ ok: false, status: 403 })
    }
  })
})

describe('the copy', () => {
  it('has no digit in the words a player reads', () => {
    for (const w of [...Object.values(COPY), ...Object.values(HINTS)]) expect(/[0-9]/.test(w as string)).toBe(false)
  })
})
