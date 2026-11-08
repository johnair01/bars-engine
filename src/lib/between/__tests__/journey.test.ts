// The healing journey, slice 1 (Six-faces-council spec .specify/specs/healing-journey, T004 and T005). The invariants:
// one log per move made and never fewer, a missed day is simply "not made", the bands never gate, three objects or the
// coach's hand light the next place, no page is kept before the storage rule is agreed, and closing keeps the world.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { close, countsByMove, daysOf, DIARY, diaryAt, enrolled, finishPage, furnishingOf, furnishings, logsOf, MOVES, newPage, nextVoice, OPENERS, pageFor, markSent, mayMarkToSend, pagesReadable, pileSlots, placeLit, sentPages, shelfShown, steadiness, withMove, withTurn } from '../../../../public/between/journey.js'
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

describe('journey.js: the nook draws only what the rules say (T006 to T009)', () => {
  it('the woodpile at n is the pile at n-1 plus one log: slots never repeat and the old ones stay', () => {
    for (let n = 1; n <= 60; n++) {
      const a = pileSlots(n), b = pileSlots(n + 1)
      expect(a).toHaveLength(n)
      expect(b.slice(0, n)).toEqual(a)
      expect(new Set(b.map(([c, l]) => c + ',' + l)).size).toBe(n + 1)
    }
    expect(Math.max(...pileSlots(60).map(([, l]) => l))).toBeLessThanOrEqual(4)
    expect(pileSlots(0)).toEqual([])
  })
  it('a move made adds one record and nothing else changes; an unknown move adds none', () => {
    const at = new Date('2026-11-10T09:00:00')
    const m1 = withMove({ moves: [] }, 'hearth', false, at)
    expect(m1).toHaveLength(1)
    expect(m1[0]).toMatchObject({ move: 'hearth', on: '2026-11-10' })
    expect(Object.keys(m1[0]).sort()).toEqual(['at', 'move', 'on'])
    expect(withMove({ moves: m1 }, 'window', true, at)[1]).toMatchObject({ move: 'window', life: true })
    expect(withMove({ moves: m1 }, 'swim', false, at)).toHaveLength(1)
    expect(logsOf(withMove({ moves: m1 }, 'window', true, at))).toBe(2)
  })
  it('the shelf shows carried and held objects, three at most; worked ones become furnishings', () => {
    const pack = [obj('a'), obj('b', 'held'), obj('c'), obj('d'), obj('e', 'worked', 'water'), obj('f', 'left')].map((o) => (o.state === 'worked' ? { ...o, furnishing: 'lamp' } : o))
    expect(shelfShown(pack).map((o) => o.id)).toEqual(['a', 'b', 'c'])
    expect(furnishings(pack).map((o) => o.id)).toEqual(['e'])
    expect(enrolled(null)).toBe(false)
    expect(enrolled({ program: { closedAt: 'x' } })).toBe(false)
    expect(enrolled({ program: { id: 'p' } })).toBe(true)
  })
  it('the diary reopens on the same page and finishing it makes a furnishing and one diary log', () => {
    const at = new Date('2026-11-10T20:00:00')
    const page = newPage('o1', at)
    const doc = { pack: [obj('o1', 'carried', 'water')], pages: [page], moves: [] }
    expect(pageFor(doc, 'o1')?.id).toBe(page.id)
    expect(pageFor(doc, 'other')).toBeNull()
    const done = finishPage(doc, page.id, at)
    expect(pageFor(done, 'o1')).toBeNull()
    expect(done.pack[0]).toMatchObject({ state: 'worked', furnishing: 'lamp' })
    expect(done.moves).toHaveLength(1)
    expect(done.moves[0].move).toBe('diary')
    expect(journeyWrite({ program: { id: 'p', coachId: 'c', startsOn: '2026-11-10', endsOn: '2027-02-02', agreedOn: '2026-11-10', closedAt: null }, ...done } as never).ok).toBe(true)
  })
  it('a longer page adds nothing: the pile counts the making, not the words', () => {
    let pass = newPage('o1').pass
    for (let i = 0; i < 20; i++) pass = withTurn(pass, 'a long line '.repeat(20), nextVoice(pass.thread))
    expect(pass.thread).toHaveLength(20)
    expect(logsOf([])).toBe(0)
  })
  it('the voices alternate from the player, and a blank line is not a turn', () => {
    let pass = newPage('o1').pass
    expect(nextVoice(pass.thread)).toBe('me')
    pass = withTurn(pass, 'Why are you here?', 'me')
    expect(nextVoice(pass.thread)).toBe('it')
    expect(withTurn(pass, '   ', 'it').thread).toHaveLength(1)
  })
  it('the diary sits at the first part not yet written', () => {
    const p = newPage('o1').pass
    expect(diaryAt(p)).toBe('face')
    expect(diaryAt({ ...p, faceCharge: 'x' })).toBe('name')
    expect(diaryAt({ ...p, faceCharge: 'x', maskName: 'y' })).toBe('talk')
    expect(diaryAt({ ...p, faceCharge: 'x', maskName: 'y', beVoice: 'z' })).toBe('be')
  })
  it('the diary asks the built 3-2-1 questions word for word (FR-004)', () => {
    const tsx = readFileSync('src/components/clean-up/ThreeTwoOnePasses.tsx', 'utf8').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/\s+/g, ' ')
    const strings = [DIARY.face.title, DIARY.face.caption, DIARY.face.ask, DIARY.name.title, DIARY.name.ask, DIARY.talk.ask, DIARY.be.title, DIARY.be.caption, DIARY.be.shift, DIARY.face.hint, DIARY.be.hint, DIARY.talk.meHint, DIARY.be.shiftHint]
    for (const s of strings) expect(tsx, s).toContain(s)
    expect(tsx).toContain('Drop the dialogue. You are {partName} now, alone, with nobody to convince and nothing to ask for. Say what is true when there’s no one listening.')
    expect(DIARY.be.ask('The Lookout')).toContain('You are The Lookout now, alone')
    const content = readFileSync('src/lib/clean-up/check-content.ts', 'utf8')
    for (const o of OPENERS) expect(content).toContain(o)
  })
})

describe('the storage rule: the coach reads only pages the player sends', () => {
  const program = { id: 'p1', coachId: 'coach', startsOn: '2026-11-10', endsOn: '2027-02-01', agreedOn: '2026-11-10', sendAgreedOn: '2026-11-11', closedAt: null }
  const pg = (id: string, sentAt?: string) => ({ id, objectId: 'a', pass: {}, startedOn: '2026-11-10', doneOn: null, ...(sentAt ? { sentAt } : {}) })
  it('a coach sees only sent pages, and none once the program is closed or past its end', () => {
    const doc = { program, pages: [pg('one'), pg('two', '2026-11-12T10:00:00Z')] }
    expect(sentPages(doc, '2026-12-01').map((p: { id: string }) => p.id)).toEqual(['two'])
    expect(sentPages({ ...doc, program: { ...program, closedAt: '2026-12-02T00:00:00Z' } }, '2026-12-01')).toEqual([])
    expect(sentPages(doc, '2027-02-02')).toEqual([])
    expect(sentPages(undefined, '2026-12-01')).toEqual([])
  })
  it('markSent marks one page, can take the mark off, and leaves the input alone', () => {
    const doc = { program, pages: [pg('one'), pg('two')] }
    const sent = markSent(doc, 'two', '2026-11-12T10:00:00Z', true)
    expect(sent.pages[1].sentAt).toBe('2026-11-12T10:00:00Z')
    expect(sent.pages[0].sentAt).toBeUndefined()
    expect(markSent(sent, 'two', undefined, false).pages[1].sentAt).toBeUndefined()
    expect(doc.pages[1]).not.toHaveProperty('sentAt')
  })
  it('the player may send only after signing what sending means', () => {
    expect(mayMarkToSend(program)).toBe(true)
    expect(mayMarkToSend({ ...program, sendAgreedOn: null })).toBe(false)
    expect(mayMarkToSend({ ...program, closedAt: '2026-12-02T00:00:00Z' })).toBe(false)
  })
  it('the store refuses a sent page without the sending agreement, and takes it with', () => {
    const base = { pack: [], moves: [], places: [], learned: [] }
    const sentPage = { id: 'pg1', objectId: 'a', pass: {}, sentAt: '2026-11-12T10:00:00Z' }
    expect(journeyWrite({ ...base, program: { ...program, sendAgreedOn: null }, pages: [sentPage] }).ok).toBe(false)
    expect(journeyWrite({ ...base, program, pages: [sentPage] }).ok).toBe(true)
    expect(journeyWrite({ ...base, program, pages: [{ ...sentPage, sentAt: 5 }] }).ok).toBe(false)
  })
})
