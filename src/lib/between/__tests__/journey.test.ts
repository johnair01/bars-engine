// The healing journey, slice 1 (Six-faces-council spec .specify/specs/healing-journey, T004 and T005). The invariants:
// one log per move made and never fewer, a missed day is simply "not made", the bands never gate, three objects or the
// coach's hand light the next place, no page is kept before the storage rule is agreed, and closing keeps the world.
import { describe, expect, it } from 'vitest'
import { close, countsByMove, daysOf, furnishingOf, logsOf, MOVES, pagesReadable, placeLit, steadiness } from '../../../../public/between/journey.js'
import { journeyWrite, mayWrite, parsePath, plantedHome, type Doc, type Who } from '@/lib/between/rules'

const mv = (move: string, on: string, life = false) => ({ move, life, on, at: `${on}T10:00:00Z` })
const obj = (id: string, state = 'carried', feeling = 'fire') => ({ id, feeling, setOff: 'a text', body: 'chest', pickedOn: '2026-11-10', state })

describe('journey.js: moves are logs', () => {
  it('one log per move record, no daily cap, and an unknown move adds none', () => {
    const moves = [mv('window', '2026-11-10'), mv('window', '2026-11-10'), mv('hearth', '2026-11-10', true), { move: 'nonsense', on: '2026-11-10', at: 'x' }]
    expect(logsOf(moves)).toBe(3)
    expect(logsOf([])).toBe(0)
    expect(logsOf(undefined)).toBe(0)
  })
  it('counts per move, all seven present, "in my life" folds into the same move', () => {
    const c = countsByMove([mv('window', '2026-11-10'), mv('window', '2026-11-11', true), mv('diary', '2026-11-11')])
    expect(Object.keys(c)).toEqual(MOVES)
    expect(c).toMatchObject({ window: 2, diary: 1, floorboards: 0 })
  })
})

describe('journey.js: the coach reads days made or not made', () => {
  it('lists every day of the program, missed days as not made, with no streak or score', () => {
    const days = daysOf([mv('window', '2026-11-10'), mv('hearth', '2026-11-12')], '2026-11-10', '2026-11-13')
    expect(days.map(d => d.on)).toEqual(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'])
    expect(days.map(d => d.didMake)).toEqual([true, false, true, false])
    expect(days[0].made).toEqual(['window'])
    for (const d of days) expect(Object.keys(d).sort()).toEqual(['didMake', 'made', 'on'])
  })
  it('bad dates give no days', () => {
    expect(daysOf([], 'nope', '2026-11-13')).toEqual([])
    expect(daysOf([], '2026-11-13', '2026-11-10')).toEqual([])
  })
})

describe('journey.js: steadiness bands', () => {
  it('never made is one to learn; 1-2 offered; 3-6 steady; 7+ sure', () => {
    expect([0, 1, 2, 3, 6, 7, 40].map(steadiness)).toEqual(['learn', 'offered', 'offered', 'steady', 'steady', 'sure', 'sure'])
    expect(steadiness(undefined)).toBe('learn')
  })
})

describe('journey.js: the next place', () => {
  it('lights on three objects in the pack or the coach opening it, not on objects left behind', () => {
    expect(placeLit([obj('a'), obj('b')], false)).toBe(false)
    expect(placeLit([obj('a'), obj('b'), obj('c', 'held')], false)).toBe(true)
    expect(placeLit([obj('a'), obj('b'), obj('c', 'left')], false)).toBe(false)
    expect(placeLit([], true)).toBe(true)
  })
  it('a worked object becomes a furnishing chosen by its feeling', () => {
    expect(['wood', 'fire', 'earth', 'metal', 'water'].map(furnishingOf)).toEqual(['plant', 'lamp', 'plant', 'tool', 'lamp'])
    expect(furnishingOf('x')).toBe(null)
  })
})

describe('journey.js: pages and close', () => {
  const program = { id: 'p1', coachId: 'coach', startsOn: '2026-11-10', endsOn: '2027-02-01', agreedOn: '2026-11-10', closedAt: null }
  it('pages are readable only when agreed, open and not past the end date', () => {
    expect(pagesReadable(program, '2026-12-01')).toBe(true)
    expect(pagesReadable({ ...program, agreedOn: null }, '2026-12-01')).toBe(false)
    expect(pagesReadable({ ...program, closedAt: '2026-12-02T00:00:00Z' }, '2026-12-01')).toBe(false)
    expect(pagesReadable(program, '2027-02-02')).toBe(false)
  })
  it('close removes the pages, returns them for the copy, and keeps the world', () => {
    const doc = { program, pack: [obj('a', 'worked')], pages: [{ id: 'pg1', objectId: 'a', pass: {}, startedOn: '2026-11-10', doneOn: null }], moves: [mv('window', '2026-11-10')], places: [{ id: 'gate', state: 'lit' }], learned: ['hearth'] }
    const out = close(doc, '2026-12-01T00:00:00Z')
    expect(out.pages).toHaveLength(1)
    expect(out.doc.pages).toEqual([])
    expect(out.doc.moves).toEqual(doc.moves)
    expect(out.doc.pack).toEqual(doc.pack)
    expect(out.doc.places).toEqual(doc.places)
    expect(out.doc.program.closedAt).toBe('2026-12-01T00:00:00Z')
    expect(doc.pages).toHaveLength(1) // the input is not changed
    expect(close(out.doc, '2027-01-01T00:00:00Z').doc.program.closedAt).toBe('2026-12-01T00:00:00Z')
  })
})

describe('rules.ts: the journey key', () => {
  const me = 'playerA'
  const member: Who = { playerId: me, member: true, invited: false }
  const home = plantedHome(me, 1)
  const t = parsePath(`data/users/${me}/journey`)!
  const program = { id: 'p1', coachId: 'coach', startsOn: '2026-11-10', endsOn: '2027-02-01', agreedOn: null }
  const page = { id: 'pg1', objectId: 'a', pass: { faceCharge: 'x' }, startedOn: '2026-11-10', doneOn: null }
  const doc = (extra: Doc = {}): Doc => ({ program, pack: [obj('a')], pages: [], moves: [mv('window', '2026-11-10')], places: [], learned: [], ...extra })

  it('is a private key the owner writes in their homeroom only', () => {
    expect(t).toEqual({ table: 'privates', playerId: me, key: 'journey' })
    expect(mayWrite(member, home, t, 'set', doc(), null).ok).toBe(true)
    expect(mayWrite(member, { ...home, kind: 'between' }, t, 'set', doc(), null).ok).toBe(false)
    expect(mayWrite({ playerId: 'playerB', member: true, invited: false }, home, t, 'set', doc(), null).ok).toBe(false)
  })
  it('refuses pages while the program has no agreed-on date, and accepts them after', () => {
    const v = journeyWrite(doc({ pages: [page as never] }))
    expect(v.ok).toBe(false)
    expect(!v.ok && v.status).toBe(403)
    expect(journeyWrite(doc({ program: { ...program, agreedOn: '2026-11-10' }, pages: [page as never] })).ok).toBe(true)
  })
  it('a move record holds a move, a day and a time and no text; a score or streak field is refused', () => {
    expect(journeyWrite(doc({ moves: [{ ...mv('window', '2026-11-10'), note: 'I felt sad' }] as never })).ok).toBe(false)
    expect(journeyWrite(doc({ moves: [mv('swim', '2026-11-10')] as never })).ok).toBe(false)
    expect(journeyWrite(doc({ streak: 4 } as never)).ok).toBe(false)
    expect(journeyWrite(doc({ score: 10 } as never)).ok).toBe(false)
  })
  it('an object is a tag in one of five feelings', () => {
    expect(journeyWrite(doc({ pack: [{ ...obj('a'), feeling: 'rage' }] as never })).ok).toBe(false)
    expect(journeyWrite(doc({ pack: [{ ...obj('a', 'worked'), furnishing: 'lamp' }] as never })).ok).toBe(true)
  })
})
