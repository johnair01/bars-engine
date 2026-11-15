import { describe, expect, it } from 'vitest'
// The hollow's games (Six-faces-council .specify/specs/friendship-between-growth, "The hollow's games", FR-016 to FR-022).
// The invariants: a door is set once at the first spark; a jar is opened only by the other friend and never taken back once
// open; a dance and a call are written once a Between day by one of the two, and a call is one of tonight's seeded three;
// nothing a game renders or stores carries a count.
import { COPY, CALL_WORDS, PLACES, KINDS, callsFor, cleanPath, doorOfKind, betweenDay, gameFeed, litPlaces, tableGame, DANCE_MIN_MS } from '../../../../public/between/games/core.js'
import { mayWrite, plantedGarden, roomSummary, type Doc, type Who, type Target } from '@/lib/between/rules'

const A = 'playerA', B = 'playerB', C = 'playerC', GID = 'garden-xyz'
const who = (p: string): Who => ({ playerId: p, member: p === A || p === B, invited: false })
const day0 = 1_700_000_000_000
const garden: Doc = { kind: 'room', startedBy: A, members: { [A]: {}, [B]: {} }, phase: 'between', betweenSince: day0, startedAt: day0, door: 'allyship', setup: { who: 'B', kind: 'Allyship' } }
const item = (id: string): Target => ({ table: 'items', id })
const write = (p: string, t: Target, op: 'set' | 'update' | 'delete', data: Doc | null, cur: Doc | null = null, now = day0 + 2 * 864e5 + 5000) => mayWrite(who(p), garden, t, op, data, cur, GID, now)

describe('the door (FR-016)', () => {
  it('maps a relationship kind to its door and nothing else', () => {
    expect(doorOfKind('Friendship')).toBe('friendcraft')
    expect(doorOfKind('Romance or flirting')).toBe('flirtcraft')
    expect(doorOfKind('Allyship')).toBe('allyship')
    expect(doorOfKind('Family')).toBeNull()
    expect(tableGame({ door: 'friendcraft' })).toBe('found-lights')
    expect(tableGame({})).toBeNull()
  })
  it('is set once, when the spark is planted', () => {
    const g = plantedGarden(A, { setup: { who: 'Jun', kind: 'Romance or flirting' } }, day0)!
    expect(g.door).toBe('flirtcraft')
    expect(plantedGarden(A, { setup: { who: 'Jun', kind: 'Family' } }, day0)!.door).toBeUndefined()
    const v = mayWrite(who(A), garden, { table: 'garden' }, 'update', { door: 'friendcraft' }, null)
    expect(v.ok).toBe(false)
  })
})

describe('jars (FR-018)', () => {
  const jar: Doc = { kind: 'jar', by: A, at: 5, what: 'line', text: 'The dog learned the gate.', status: 'left' }
  it('is left by its maker, covered, with one thing in it', () => {
    expect(write(A, item('j1'), 'set', jar).ok).toBe(true)
    expect(write(A, item('j1'), 'set', { ...jar, status: 'opened' }).ok).toBe(false)
    expect(write(A, item('j1'), 'set', { ...jar, text: 'x'.repeat(141) }).ok).toBe(false)
    expect(write(A, item('j1'), 'set', { ...jar, what: 'colour', text: 'red' }).ok).toBe(false)
    expect(write(A, item('j1'), 'set', { ...jar, what: 'colour', text: '#e8a33c' }).ok).toBe(true)
    expect(write(A, item('j1'), 'set', { ...jar, score: 3 }).ok).toBe(false)
  })
  it('is opened only by the other friend, once, and never opened by its maker', () => {
    expect(write(B, item('j1'), 'update', { status: 'opened', openedAt: 9, openedBy: B }, jar).ok).toBe(true)
    expect(write(A, item('j1'), 'update', { status: 'opened', openedAt: 9, openedBy: A }, jar).ok).toBe(false)
    expect(write(B, item('j1'), 'update', { status: 'opened', openedAt: 9, openedBy: A }, jar).ok).toBe(false)
    expect(write(B, item('j1'), 'update', { status: 'opened', openedAt: 9, openedBy: B }, { ...jar, status: 'opened' }).ok).toBe(false)
    expect(write(B, item('j1'), 'update', { text: 'mine now' }, jar).ok).toBe(false)
  })
  it('is taken back by its maker while it waits, and never by the other, and never once open', () => {
    expect(write(A, item('j1'), 'delete', null, jar).ok).toBe(true)
    expect(write(B, item('j1'), 'delete', null, jar).ok).toBe(false)
    expect(write(A, item('j1'), 'delete', null, { ...jar, status: 'opened' }).ok).toBe(false)
  })
  it('joins the waiting list of the friend it was left for, and of no one else', () => {
    const s = roomSummary(B, GID, garden, [{ id: 'j1', data: jar }], {})
    expect(s.waiting).toEqual([{ id: 'j1', what: 'jar' }])
    expect(roomSummary(A, GID, garden, [{ id: 'j1', data: jar }], {}).waiting).toEqual([])
    expect(roomSummary(B, GID, garden, [{ id: 'j1', data: { ...jar, status: 'opened' } }], {}).waiting).toEqual([])
  })
  it('is a feed only once opened', () => {
    expect(gameFeed(jar)).toBeNull()
    expect(gameFeed({ ...jar, status: 'opened', openedBy: B, openedAt: 9 })).toEqual({ kind: 'jar', by: [A, B], at: 9 })
  })
})

describe('dances (FR-019)', () => {
  const day = betweenDay(garden, day0 + 2 * 864e5 + 5000)
  const dance: Doc = { kind: 'dance', by: A, pair: [A, B], day, at: 7, ms: 41000, crossings: 12 }
  it('is the days since the Between began', () => { expect(day).toBe(2) })
  it('is written once, by one of the two, for two who held it thirty seconds', () => {
    expect(write(A, item('dance-2'), 'set', dance).ok).toBe(true)
    expect(write(A, item('dance-2'), 'set', dance, dance).ok).toBe(false)           // create only
    expect(write(A, item('dance-2'), 'update', { ms: 99999 }, dance).ok).toBe(false)
    expect(write(A, item('dance-2'), 'set', { ...dance, ms: DANCE_MIN_MS - 1 }).ok).toBe(false)
    expect(write(A, item('dance-9'), 'set', dance).ok).toBe(false)                    // the id names the day
    expect(write(A, item('dance-2'), 'set', { ...dance, pair: [A, C] }).ok).toBe(false)
    expect(write(C, item('dance-2'), 'set', { ...dance, by: C }).ok).toBe(false)      // not a member
    expect(write(A, item('dance-2'), 'set', { ...dance, words: 'hi' }).ok).toBe(false)
  })
  it('is a feed', () => { expect(gameFeed(dance)).toEqual({ kind: 'dance', by: [A, B], at: 7 }) })
})

describe('calls (FR-020)', () => {
  const day = 2, tonight = callsFor(GID, day)
  const call: Doc = { kind: 'call', by: A, pair: [A, B], day, place: tonight[0], at: 8 }
  it('seeds three places, one of each kind, the same for both friends and for the same night', () => {
    expect(tonight).toHaveLength(3)
    expect(tonight.map(i => PLACES[i].kind)).toEqual(KINDS)
    expect(callsFor(GID, day)).toEqual(tonight)
    expect(PLACES).toHaveLength(12)
    const nights = new Set(Array.from({ length: 12 }, (_, d) => callsFor(GID, d).join()))
    expect(nights.size).toBeGreaterThan(3)
  })
  it('is carried to one of tonight\'s three, once a night', () => {
    expect(write(A, item('call-2'), 'set', call).ok).toBe(true)
    const other = PLACES.map((_, i) => i).find(i => !tonight.includes(i))!
    expect(write(A, item('call-2'), 'set', { ...call, place: other }).ok).toBe(false)
    expect(write(A, item('call-2'), 'set', call, call).ok).toBe(false)
    expect(write(A, item('call-3'), 'set', call).ok).toBe(false)
    expect(write(A, item('call-2'), 'set', { ...call, place: 40 }).ok).toBe(false)
  })
  it('keeps twelve lit places; the oldest dims to a window', () => {
    const calls = Array.from({ length: 14 }, (_, i) => ({ kind: 'call', place: i % 12, at: i + 1, pair: [A, B] }))
    const { lit, window } = litPlaces(calls)
    expect(lit.length).toBeLessThanOrEqual(12)
    expect(new Set([...lit, ...window]).size).toBe(12)
  })
})

describe('presence path', () => {
  it('keeps numbers, clamps them to the room, and never more than a poll\'s worth', () => {
    const p = cleanPath(Array.from({ length: 40 }, (_, i) => [i * 10, 99, -50, i]))
    expect(p).toHaveLength(24)
    expect(p[0][0]).toBe(8); expect(p[0][1]).toBe(4); expect(p[0][2]).toBe(-8)
    expect(cleanPath([['x', 1, 1, 1], [1, 1, 1]])).toEqual([])
    expect(cleanPath('no')).toEqual([])
  })
})

describe('the words (FR-021)', () => {
  it('carry no digit and no counting word', () => {
    const words = [...Object.values(COPY).filter(v => typeof v === 'string'), ...Object.values(CALL_WORDS), COPY.jarFor('Mara')] as string[]
    for (const w of words) { expect(w).not.toMatch(/\d/); expect(w).not.toMatch(/\b(score|streak|points?|level|count|times)\b/i) }
  })
})
