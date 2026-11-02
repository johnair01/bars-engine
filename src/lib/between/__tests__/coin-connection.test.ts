import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// The coin table, build 2 (Six-faces-council pass bar-intake-2): advice on connection, a move in a lane and a suit, kept
// in your homeroom; a cast left face up in a hollow, answered by the other person with a turn.
import { castFromTosses } from '../../../../public/between/iching/cast.js'
import {
  answerOf, cardFor, faceUpItem, INVITE_WORDS, keptEntry, mayAsk, MOVE_LANES, moveOf, nextLaneOf, openCasts, PLANT, PURSUIT_WORDS,
  pursuitFree, SELF, SPARK_LANE, suitOf, SUITS, whoChoices, WORK_WORDS, workFree,
} from '../../../../public/between/iching/connection.js'
import { suggest } from '../../../../public/calrunia/next-moves.js'
import { homeWrite, mayWrite, roomSummary, type Doc } from '@/lib/between/rules'

const root = join(__dirname, '../../../..')
const table = JSON.parse(readFileSync(join(root, 'public/between/iching/hexagrams.json'), 'utf8'))
const readings = JSON.parse(readFileSync(join(root, 'public/between/iching/connection.json'), 'utf8'))
const deck = JSON.parse(readFileSync(join(root, 'public/oracle/deck.json'), 'utf8'))

const STILL = [[2, 3, 3], [3, 3, 2], [2, 2, 3], [2, 3, 3], [3, 2, 2], [3, 3, 2]] // 39, nothing moving
const INNER = [[2, 2, 2], [3, 3, 2], [2, 2, 3], [2, 3, 3], [3, 2, 2], [3, 3, 2]] // line 1 moving
const OUTER = [[2, 3, 3], [3, 3, 2], [2, 2, 3], [2, 3, 3], [3, 2, 2], [3, 3, 3]] // line 6 moving
const BOTH = [[2, 3, 3], [3, 3, 3], [2, 2, 3], [2, 3, 3], [2, 2, 2], [3, 3, 2]] // lines 2 and 5: the previews' cast

const A = 'alice', B = 'bob'
const room = { id: 'r1', phase: 'between', person: B, who: 'Bob' }

describe('the readings for connection', () => {
  it('has one reading per hexagram, each ending in a move for yourself and one for them', () => {
    expect(readings.readings.map((r: { n: number }) => r.n)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1))
    for (const r of readings.readings) {
      expect(['partner', 'between']).toContain(r.lane)
      expect(r.reading.length).toBeGreaterThan(20)
      expect(r.self.length).toBeGreaterThan(10)
      expect(r.them).toContain('{name}')
      expect(r.self).not.toContain('{name}')
    }
  })

  it('never names a task, a deadline, a team or a board (the table is not for work)', () => {
    for (const r of readings.readings) for (const t of [r.reading, r.self, r.them]) expect(workFree(t), `${r.n}: ${t}`).toBe(true)
    for (const bad of ['Finish the task', 'before the deadline', 'tell your team', 'post it on the board', 'a workorder', 'the project'])
      expect(WORK_WORDS.test(bad), bad).toBe(true)
  })

  it('keeps every move short enough for the store (a note is at most 280 characters)', () => {
    for (const r of readings.readings) for (const t of [r.self, r.them.replace('{name}', 'Someone With A Long Name')]) expect(t.length).toBeLessThanOrEqual(280)
  })
})

describe('a cast to a move in a lane and a suit', () => {
  it('reads the suit from where the cast is moving', () => {
    expect(suitOf(castFromTosses(STILL, table))).toBe('WU')
    expect(suitOf(castFromTosses(INNER, table))).toBe('CU')
    expect(suitOf(castFromTosses(OUTER, table))).toBe('SU')
    expect(suitOf(castFromTosses(BOTH, table))).toBe('GU')
    expect(Object.keys(SUITS)).toEqual(['WU', 'CU', 'GU', 'SU'])
  })

  it('a toss for yourself goes to your own lane; for them, to the lane its reading names, with their name', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = castFromTosses(BOTH, table) as any
    const me = moveOf(c, SELF, readings)
    expect(me.lane).toBe('yourself')
    expect(me.line).toBe(readings.readings.find((r: { n: number }) => r.n === c.n).self)
    expect(me.becomes).toEqual({ n: c.becomes.n, name: c.becomes.name })
    expect(me.heading).toBe(readings.readings.find((r: { n: number }) => r.n === c.becomes.n).reading)
    const them = moveOf(c, { kind: 'them', room: 'r1', name: 'Bob' }, readings)
    expect(['partner', 'between']).toContain(them.lane)
    expect(them.line).toContain('Bob')
    expect(them.line).not.toContain('{name}')
    expect(them.suit).toBe('GU')
  })

  it('gives the same move for the same tosses (no AI, no dice behind the reading)', () => {
    const w = { kind: 'them', room: 'r1', name: 'Bob' }
    expect(moveOf(castFromTosses(BOTH, table), w, readings)).toEqual(moveOf(castFromTosses(BOTH, table), w, readings))
  })

  it('offers yourself, the people you share an open Between with, and (build 3b) your sparks as someone you are drawn to', () => {
    const rooms = [room, { id: 'r2', phase: 'spark', person: null, who: 'Cleo' }, { id: 'r3', phase: 'closed', person: 'dan', who: 'Dan' }]
    expect(whoChoices(rooms)).toEqual([SELF, { kind: 'them', room: 'r1', person: B, name: 'Bob' }, { kind: 'spark', room: 'r2', name: 'Cleo' }])
    expect(whoChoices(rooms, 'r9')).toEqual([SELF])
    expect(mayAsk({ kind: 'them', room: 'r1', person: B }, rooms)).toBe(true)
    expect(mayAsk({ kind: 'them', room: 'r1', person: 'eve' }, rooms)).toBe(false)
    expect(mayAsk({ kind: 'them', room: 'r2', person: 'cleo' }, rooms)).toBe(false)
  })

  it('keeps the room, never the name, in your homeroom', () => {
    const m = moveOf(castFromTosses(STILL, table), { kind: 'them', room: 'r1', name: 'Bob' }, readings)
    const k = keptEntry(m, 5)
    expect(k).toMatchObject({ n: 39, lane: m.lane, suit: 'WU', room: 'r1', at: 5, done: null })
    expect(JSON.stringify({ ...k, line: '' })).not.toContain('Bob')
    expect(homeWrite({ casts: { c1: k } }).ok).toBe(true)
    expect(homeWrite({ casts: { c1: keptEntry(moveOf(castFromTosses(STILL, table), SELF, readings), 5) } }).ok).toBe(true)
    expect(homeWrite({ casts: { c1: { ...k, lane: 'work' } } }).ok).toBe(false)
    expect(homeWrite({ casts: { c1: { ...k, room: null } } }).ok, 'a move for someone names their room').toBe(false)
    expect(homeWrite({ casts: { c1: { ...k, who: 'Bob' } } }).ok, 'no name, no extra fields').toBe(false)
  })

  it('lists your open kept moves for a week, newest first', () => {
    const now = 10 * 864e5
    const home = { casts: { a: { at: now - 864e5, line: 'a' }, b: { at: now - 3600e3, line: 'b' }, c: { at: now - 8 * 864e5, line: 'c' }, d: { at: now, line: 'd', done: now } } }
    expect(openCasts(home, now).map(c => c.id)).toEqual(['b', 'a'])
  })
})

describe('a kept move joins the next moves', () => {
  const now = Date.UTC(2026, 9, 31, 12)
  const cast = (lane: string, room: string | null, at = now - 3600e3) => ({ n: 31, becomes: null, lane, suit: 'WU', room, line: 'The move.', at, done: null })

  it('takes your own lane ahead of the check-in nudge', () => {
    const m = suggest({ home: { lastCheckin: null, goals: [], casts: { c1: cast('yourself', null) } }, rooms: [] }, now)
    expect(m[0]).toMatchObject({ lane: 'yourself', id: 'cast:c1', line: 'The move.', act: 'coins' })
  })

  it('takes the partner lane after anything waiting on you, ahead of a nudge, and walks you to that room', () => {
    const r = { ...room, invitations: [], waiting: [], revisit: [], lastSatTogether: null }
    let m = suggest({ home: { lastCheckin: now, goals: [{}], casts: { c1: cast('partner', 'r1') } }, rooms: [r] }, now)
    expect(m.find(x => x.lane === 'partner')).toMatchObject({ id: 'cast:c1', act: 'room:r1' })
    m = suggest({ home: { lastCheckin: now, goals: [{}], casts: { c1: cast('partner', 'r1') } }, rooms: [r], here: 'r1' }, now)
    expect(m.find(x => x.lane === 'partner')).toMatchObject({ act: 'coins' })
    const asked = { ...r, invitations: [{ id: 'i1' }] }
    m = suggest({ home: { lastCheckin: now, goals: [{}], casts: { c1: cast('partner', 'r1') } }, rooms: [asked] }, now)
    expect(m.find(x => x.lane === 'partner')!.id).toBe('invite:r1:i1')
  })

  it('drops a move that is done, a week old, or for a room no longer open', () => {
    const r = { ...room, invitations: [], waiting: [], revisit: [], lastSatTogether: now }
    const home = (c: Doc) => ({ lastCheckin: now, goals: [{}], casts: { c1: c } })
    for (const c of [{ ...cast('between', 'r1'), done: now }, cast('between', 'r1', now - 8 * 864e5), cast('between', 'r9')])
      expect(suggest({ home: home(c), rooms: [r] }, now).find(x => x.lane === 'between')).toBeUndefined()
  })

  it('a face-up cast from the other person waits on you in the partner lane, and opens the table', () => {
    const r = { ...room, invitations: [], waiting: [{ id: 'k1', what: 'cast' }], revisit: [], lastSatTogether: now }
    const m = suggest({ home: { lastCheckin: now, goals: [{}] }, rooms: [r], here: 'r1' }, now)
    expect(m.find(x => x.lane === 'partner')).toMatchObject({ line: 'With Bob, they left a cast face up on the coin table.', act: 'coins' })
  })
})

describe('a cast left face up in a hollow', () => {
  const g: Doc = { kind: 'room', phase: 'between', startedBy: A, members: { [A]: { joinedAt: 1 }, [B]: { joinedAt: 2 } } }
  const home: Doc = { kind: 'home', startedBy: A, members: { [A]: { joinedAt: 1 } } }
  const who = (p: string) => ({ playerId: p, member: true, invited: false })
  const T = { table: 'items' as const, id: 'k1' }
  const item = faceUpItem(moveOf(castFromTosses(BOTH, table), { kind: 'them', room: 'r1', name: 'Bob' }, readings), A, 9) as Doc

  it('is set, changed and taken back only by its tosser', () => {
    expect(mayWrite(who(A), g, T, 'set', item, null).ok).toBe(true)
    expect(mayWrite(who(B), g, T, 'set', { ...item, by: A }, null).ok).toBe(false)
    expect(mayWrite(who(B), g, T, 'delete', null, item).ok).toBe(false)
    expect(mayWrite(who(A), g, T, 'delete', null, item).ok).toBe(true)
    expect(mayWrite(who(A), g, T, 'set', { ...item, status: 'offered' }, null).ok, 'a cast lies face up').toBe(false)
    expect(mayWrite(who(A), g, T, 'set', { ...item, text: 'more words' }, null).ok, 'nothing but its reading and move').toBe(false)
    expect(mayWrite(who(A), home, T, 'set', item, null).ok, 'not in a homeroom').toBe(false)
  })

  it('is answered by the other person with a card and a depth, for themself only', () => {
    const card = cardFor(deck, item.suit as string, 'k1')!
    expect(card.suit.code).toBe(item.suit)
    expect(cardFor(deck, item.suit as string, 'k1')).toBe(card)
    const a = answerOf(card, 'medium', 10)
    expect(mayWrite(who(B), g, T, 'update', { answer: { [B]: a } }, item).ok).toBe(true)
    expect(mayWrite(who(B), g, T, 'update', { answer: { [A]: a } }, item).ok).toBe(false)
    expect(mayWrite(who(B), g, T, 'update', { answer: { [B]: { ...a, depth: 'whatever' } } }, item).ok).toBe(false)
    expect(mayWrite(who(B), g, T, 'update', { line: 'changed' }, item).ok).toBe(false)
    expect(mayWrite(who(A), g, T, 'update', { answer: { [A]: a } }, item).ok, 'the tosser does not answer their own').toBe(false)
    expect(() => answerOf(card, 'deep', 1)).toThrow()
  })

  it('waits on the other person until they answer, never on the tosser', () => {
    const summary = (me: string, it: Doc) => roomSummary(me, 'r1', g, [{ id: 'k1', data: it }]).waiting
    expect(summary(B, item)).toEqual([{ id: 'k1', what: 'cast' }])
    expect(summary(A, item)).toEqual([])
    expect(summary(B, { ...item, answer: { [B]: { card: 'WU-A', depth: 'easy', at: 1 } } })).toEqual([])
  })
})

// Build 3b, the spark at the table (pass bar-intake-3; his steer on bi-flirtcraft-door: "They learn about themselves and
// then the other and they invite the other into playing"; positions bi-door-is-a-spark, bi-door-order, bi-door-invite-by-hand).
describe('the spark at the table', () => {
  const spark = { id: 's1', phase: 'spark', person: null, who: 'Robin', personStarted: false }
  const theirSpark = { id: 's2', phase: 'spark', person: B, who: 'Bob', personStarted: true }
  const robin = { kind: 'spark', room: 's1', name: 'Robin' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cast = (t: number[][]) => castFromTosses(t, table) as any

  it('offers each spark you started as someone you are drawn to, after your Betweens', () => {
    expect(whoChoices([room, spark, theirSpark])).toEqual([SELF, { kind: 'them', room: 'r1', person: B, name: 'Bob' }, robin])
    expect(whoChoices([spark], 'r1'), 'inside a room, only that room').toEqual([SELF])
    expect(mayAsk(robin, [spark])).toBe(true)
    expect(mayAsk({ ...robin, room: 's2' }, [spark, theirSpark]), 'not a spark someone else started').toBe(false)
    expect(mayAsk({ ...robin, room: 'nope' }, [spark])).toBe(false)
    expect(PLANT.kind).toBe('plant')
  })

  it('has a line about yourself and one about learning them for every hexagram, by hand', () => {
    for (const r of readings.readings) {
      expect(r.drawn.yourself, `${r.n}`).toContain('{name}')
      expect(r.drawn.them, `${r.n}`).toContain('{name}')
      expect(r.drawn.yourself).not.toEqual(r.drawn.them)
      for (const t of [r.drawn.yourself, r.drawn.them]) expect(t.replace('{name}', 'Someone With A Long Name').length).toBeLessThanOrEqual(280)
    }
    expect(new Set(readings.readings.map((r: { drawn: { them: string } }) => r.drawn.them)).size).toBe(64)
  })

  it('never reads as pursuit or as work', () => {
    for (const r of readings.readings) for (const t of [r.drawn.yourself, r.drawn.them]) {
      expect(pursuitFree(t), `${r.n}: ${t}`).toBe(true)
      expect(workFree(t), `${r.n}: ${t}`).toBe(true)
    }
    for (const n of [1, 26, 64]) { const m = moveOf(cast(OUTER), robin, readings); expect(pursuitFree(m.line), `${n}`).toBe(true) }
    for (const bad of ['make them notice you', 'get {name} to reply', 'convince her', 'win them over', 'chase him', 'pressure them', 'persuade {name}', 'keep chasing'])
      expect(PURSUIT_WORDS.test(bad), bad).toBe(true)
    for (const ok of ['Make yourself a cup of tea', 'a window', 'Let {name} lead', 'Persuasion']) expect(PURSUIT_WORDS.test(ok), ok).toBe(false)
  })

  it('follows his order by suit: yourself, then them, then the invitation', () => {
    expect(SPARK_LANE).toEqual({ WU: 'yourself', CU: 'yourself', GU: 'them', SU: 'invite' })
    const still = moveOf(cast(STILL), robin, readings), inner = moveOf(cast(INNER), robin, readings)
    const both = moveOf(cast(BOTH), robin, readings), outer = moveOf(cast(OUTER), robin, readings)
    const r39 = readings.readings.find((r: { n: number }) => r.n === 39)
    expect([still.suit, still.lane, still.line]).toEqual(['WU', 'yourself', r39.drawn.yourself.replace('{name}', 'Robin')])
    expect([inner.suit, inner.lane]).toEqual(['CU', 'yourself'])
    expect([both.suit, both.lane]).toEqual(['GU', 'them'])
    expect(both.line).toContain('Robin')
    expect([outer.suit, outer.lane]).toEqual(['SU', 'invite'])
    expect(outer.invite).toEqual({ room: 's1', words: INVITE_WORDS })
    expect(still.invite).toBeNull()
    expect(outer.who).toEqual(robin)
    for (const m of [still, inner, both, outer]) expect(MOVE_LANES[m.lane as keyof typeof MOVE_LANES]).toBeTruthy()
  })

  it('lays the invitation in his words, and the table itself sends nothing', () => {
    expect(INVITE_WORDS).toBe("Let's play together in this room I've made")
    const m = moveOf(cast(OUTER), robin, readings)
    expect(m.line).toContain(INVITE_WORDS)
    expect(m.line).toContain('Robin')
    const src = readFileSync(join(root, 'public/between/coin-table.js'), 'utf8')
    // the only way the link leaves is the button you press: share or clipboard, through the built sparkLink path
    expect(src).toMatch(/label: s\.sent \? "Copy or share it again" : "Copy or share the link"/)
    expect(src).not.toMatch(/api\(["'`]\/api\/between\/[^"'`]*\/(invite|send|mail)/)
  })

  it('keeps a spark move in your homeroom with the room and never the name, and the store takes it', () => {
    for (const [t, lane, hasRoom] of [[STILL, 'yourself', false], [BOTH, 'between', true], [OUTER, 'between', true]] as const) {
      const k = keptEntry(moveOf(cast(t as unknown as number[][]), robin, readings), 5)
      expect(k.lane).toBe(lane)
      expect(k.room).toBe(hasRoom ? 's1' : null)
      expect(JSON.stringify(k)).not.toContain('"Robin"')
      expect(homeWrite({ casts: { c1: k } }).ok, `${lane}`).toBe(true)
    }
    expect(nextLaneOf('them')).toBe('between')
    expect(nextLaneOf('partner')).toBe('partner')
  })

  it('a kept invitation waits in the Between lane and takes you back to the spark', () => {
    const now = Date.UTC(2026, 9, 31, 18)
    const k = keptEntry(moveOf(cast(OUTER), robin, readings), now - 1000)
    const m = suggest({ home: { lastCheckin: now, goals: [{}], casts: { c1: k } }, rooms: [spark] }, now)
    const b = m.find((x: { lane: string }) => x.lane === 'between')
    expect(b && b.act).toBe('room:s1')
    expect(b && b.line).toContain(INVITE_WORDS)
  })

  it('opens the door at ?door=flirtcraft on any host, in the nook, after the first minute', () => {
    const page = readFileSync(join(root, 'public/between/garden.js'), 'utf8')
    expect(page).toMatch(/door: KQ\.get\("door"\)/)
    const src = readFileSync(join(root, 'public/between/coin-table.js'), 'utf8')
    expect(src).toMatch(/opts\.door === "flirtcraft"/)
    expect(src).toMatch(/B\.minuteOn && B\.minuteOn\(\)/)
    expect(src).toContain('The table reads for you, or for someone you are drawn to.')
  })
})
