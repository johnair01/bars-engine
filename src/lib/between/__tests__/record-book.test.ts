import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// The record book (Six-faces-council spec .specify/specs/record-book; his A on rb-new-page and on rb-ad-look-1, the ink
// diary): one page per person you toss for, a blank last page for a new name, each page the casts you kept for them.
// The probe's invariants (probe_record_book.py) are tested here: every kept cast lands on exactly one page, no cast and no
// write outside the homeroom carries a name, and a page keeps its casts when its person changes kind.
import { castFromTosses } from '../../../../public/between/iching/cast.js'
import { keptEntry, moveOf, whoChoices } from '../../../../public/between/iching/connection.js'
import { castsOn, leavesOf, lineOn, newPage, onLeaf, openAt, pageKeys, pagesOf, tabName, whoOf } from '../../../../public/between/iching/book.js'
import { homeWrite, type Doc } from '@/lib/between/rules'

const root = join(__dirname, '../../../..')
const table = JSON.parse(readFileSync(join(root, 'public/between/iching/hexagrams.json'), 'utf8'))
const readings = JSON.parse(readFileSync(join(root, 'public/between/iching/connection.json'), 'utf8'))
const STILL = [[2, 3, 3], [3, 3, 2], [2, 2, 3], [2, 3, 3], [3, 2, 2], [3, 3, 2]] // nothing moving: Wake Up
const OUTER = [[2, 3, 3], [3, 3, 2], [2, 2, 3], [2, 3, 3], [3, 2, 2], [3, 3, 3]] // line 6 moving: Show Up

const rooms = [
  { id: 'r1', phase: 'between', person: 'bob', who: 'Bob' },
  { id: 's1', phase: 'spark', who: 'Robin' },
]
const home = (extra: Doc = {}): Doc => ({ pages: { pa: { name: 'Mara', room: null, at: 2 }, pb: { name: 'Jun', room: null, at: 1 } }, casts: {}, ...extra })

describe('the leaves of the book', () => {
  it('runs yourself, each Between, each spark, each written name oldest first, then one blank page', () => {
    const L = pagesOf(rooms, home())
    expect(L.map(l => [l.kind, l.name])).toEqual([['self', 'Yourself'], ['them', 'Bob'], ['spark', 'Robin'], ['named', 'Jun'], ['named', 'Mara'], ['blank', '']])
  })

  it('holds only yourself and that hollow\'s person inside a hollow, and no blank page', () => {
    expect(pagesOf(rooms, home(), 'r1').map(l => l.kind)).toEqual(['self', 'them'])
  })

  it('opens to the page last tossed for, or to yourself on a first sitting', () => {
    const L = pagesOf(rooms, home())
    expect(openAt(L, home())).toBe(0)
    expect(L[openAt(L, home({ bookAt: 'pb' }))].name).toBe('Jun')
    expect(L[openAt(L, home({ bookAt: 'r1' }))].name).toBe('Bob')
    expect(openAt(L, home({ bookAt: 'gone' }))).toBe(0)
  })

  it('takes a written name, trimmed, never an empty one, at most forty characters', () => {
    expect(newPage('  Ari  ', 5)).toEqual({ name: 'Ari', room: null, at: 5 })
    expect(newPage('   ', 5)).toBeNull()
    expect(newPage('x'.repeat(60), 5)!.name.length).toBe(40)
  })

  it('keeps a page with no casts to its name: no fields, no counts', () => {
    const L = pagesOf(rooms, home())
    const jun = L.find(l => l.name === 'Jun')!
    expect(castsOn(jun, home())).toEqual([])
    expect(Object.keys(jun).sort()).toEqual(['key', 'kind', 'name', 'pid', 'room'])
  })

  it('puts initials on the tabs past ten pages, so twenty still fit the fore-edge', () => {
    expect(tabName({ kind: 'named', name: 'Mara Lee' }, 8)).toBe('Mara Lee')
    expect(tabName({ kind: 'named', name: 'Mara Lee' }, 12)).toBe('ML')
    expect(tabName({ kind: 'blank', name: '' }, 3)).toBe('')
  })
})

describe('keeping a cast on its page', () => {
  const keepOn = (leaf: Doc, tosses = STILL, at = 10) => pageKeys(keptEntry(moveOf(castFromTosses(tosses, table, 't'), whoOf(leaf, { store: true }), readings), at), leaf)

  it('a written name\'s cast names the page, never the name, and lands on that page', () => {
    const h = home(), L = pagesOf(rooms, h), jun = L.find(l => l.name === 'Jun')!
    const c = keepOn(jun)
    expect(c.page).toBe('pb'); expect(c.room).toBeNull()
    expect(JSON.stringify(c)).not.toContain('Jun')
    const h2 = home({ casts: { c1: c } })
    expect(castsOn(jun, h2).map(x => x.id)).toEqual(['c1'])
    expect(lineOn(castsOn(jun, h2)[0], jun)).toContain('Jun')
    expect(homeWrite(h2).ok).toBe(true)
  })

  it('a cast for yourself names neither a room nor a page', () => {
    const c = keepOn({ kind: 'self', key: 'self', name: 'Yourself' })
    expect(c.room).toBeNull(); expect(c.page).toBeUndefined()
  })

  it('a move about yourself tossed on a spark\'s page stays on that page', () => {
    const L = pagesOf(rooms, home()), robin = L.find(l => l.kind === 'spark')!
    const c = keepOn(robin) // Wake Up for a spark is a move about yourself
    expect(c.lane).toBe('yourself'); expect(c.room).toBeNull(); expect(c.page).toBe('s1')
    expect(castsOn(robin, home({ casts: { c1: c } })).length).toBe(1)
    expect(castsOn(L[0], home({ casts: { c1: c } })).length).toBe(0)
    expect(homeWrite(home({ casts: { c1: c } })).ok).toBe(true)
  })

  it('a page keeps its casts when its name gets a spark, and when the spark becomes a Between', () => {
    const jun = pagesOf(rooms, home()).find(l => l.name === 'Jun')!
    const c = keepOn(jun, OUTER)
    const sparked = { ...home({ casts: { c1: c } }), pages: { ...(home().pages as Doc), pb: { name: 'Jun', room: 's2', at: 1 } } }
    const withSpark = [...rooms, { id: 's2', phase: 'spark', who: 'Jun' }]
    const L = pagesOf(withSpark, sparked)
    expect(L.filter(l => l.name === 'Jun').length).toBe(1)
    const page = L.find(l => l.name === 'Jun')!
    expect(page.kind).toBe('spark')
    expect(castsOn(page, sparked).map(x => x.id)).toEqual(['c1'])
    const joined = [...rooms, { id: 's2', phase: 'between', person: 'jun', who: 'Jun' }]
    const L2 = pagesOf(joined, sparked), p2 = L2.find(l => l.name === 'Jun')!
    expect(p2.kind).toBe('them')
    expect(castsOn(p2, sparked).map(x => x.id)).toEqual(['c1'])
  })

  it('a name whose spark the general table hides stays its own page, with its casts', () => {
    const sparked = { ...home(), pages: { ...(home().pages as Doc), pb: { name: 'Jun', room: 's2', at: 1 } } }
    const general = whoChoices([...rooms, { id: 's2', phase: 'spark', who: 'Jun' }]).filter((w: Doc) => w.kind !== 'spark')
    const L = leavesOf(general, sparked)
    expect(L.find(l => l.name === 'Jun')!.kind).toBe('named')
  })
})

describe('the homeroom takes the book and nothing more', () => {
  it('takes pages, the page it opens at, and a cast that names a page', () => {
    expect(homeWrite({ pages: { pa: { name: 'Ari', room: null, at: 1 } }, bookAt: 'pa' }).ok).toBe(true)
    expect(homeWrite({ bookAt: 'self' }).ok).toBe(true)
  })

  it('refuses a page with anything but a name, its spark and when; and an empty or long name', () => {
    expect(homeWrite({ pages: { pa: { name: 'Ari', room: null, at: 1, phone: '555' } } }).ok).toBe(false)
    expect(homeWrite({ pages: { pa: { name: ' ', room: null, at: 1 } } }).ok).toBe(false)
    expect(homeWrite({ pages: { pa: { name: 'x'.repeat(41), room: null, at: 1 } } }).ok).toBe(false)
    expect(homeWrite({ bookAt: 'not an id!' }).ok).toBe(false)
  })

  it('refuses a cast about them that names both a room and a page, or a page the book does not hold', () => {
    const base = { n: 1, becomes: null, lane: 'between', suit: 'WU', line: 'A move.', at: 1, done: null }
    expect(homeWrite({ pages: { pa: { name: 'Ari', room: null, at: 1 } }, casts: { c1: { ...base, room: 'r1', page: 'pa' } } }).ok).toBe(false)
    expect(homeWrite({ casts: { c1: { ...base, room: null, page: 'pz' } } }).ok).toBe(false)
    expect(homeWrite({ casts: { c1: { ...base, room: null, page: 'pa', name: 'Ari' } }, pages: { pa: { name: 'Ari', room: null, at: 1 } } }).ok).toBe(false)
  })
})

describe('the probe\'s invariants on random books', () => {
  // a small seeded generator, so a failure is the same failure every run
  let seed = 7
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32)
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
  const NAMES = ['Ari', 'Bea', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Joy', 'Kit', 'Lu']
  const TOSS = () => Array.from({ length: 6 }, () => [pick([2, 3]), pick([2, 3]), pick([2, 3])])

  it('every kept cast lands on exactly one page, and no cast carries a written name, over 400 books', () => {
    for (let b = 0; b < 400; b++) {
      const rs: Doc[] = []
      const nb = Math.floor(rnd() * 4), ns = Math.floor(rnd() * 3), nn = Math.floor(rnd() * 8)
      for (let i = 0; i < nb; i++) rs.push({ id: 'r' + i, phase: 'between', person: 'u' + i, who: NAMES[i] })
      for (let i = 0; i < ns; i++) rs.push({ id: 's' + i, phase: 'spark', who: NAMES[4 + i] })
      const pages: Doc = {}
      for (let i = 0; i < nn; i++) pages['p' + i] = { name: NAMES[(i + 7) % NAMES.length] + i, room: null, at: i }
      const casts: Doc = {}, h: Doc = { pages, casts }
      const L = pagesOf(rs, h).filter(l => l.kind !== 'blank')
      for (let k = 0; k < 6; k++) {
        const leaf = pick(L)
        const c = pageKeys(keptEntry(moveOf(castFromTosses(TOSS(), table, 't'), whoOf(leaf, { store: true }), readings), k), leaf)
        casts['c' + k] = c
        // a written name lives only in pages (a Between's or a spark's move names its person, as the table always has)
        if (leaf.kind === 'named') expect(JSON.stringify(c)).not.toContain(leaf.name)
      }
      for (const [id, c] of Object.entries(casts)) expect(L.filter(l => onLeaf(c, l)).length, `book ${b} cast ${id}`).toBe(1)
      expect(homeWrite(h).ok, `book ${b}`).toBe(true)
    }
  })
})

describe('the open book at the table', () => {
  const src = readFileSync(join(root, 'public/between/coin-table.js'), 'utf8')
  const page = readFileSync(join(root, 'public/between/garden.js'), 'utf8')
  it('opens the book in place of the row of who-buttons, with tabs on the fore-edge and a blank page to write on', () => {
    expect(src).toContain('class="rb-tabs"')
    expect(src).toContain('Write a name')
    expect(src).toContain('Only you read this book.')
    expect(src).not.toContain('head: "Who is this toss for?"')
  })
  it('previews at ?nook=1&book=1 with stand-in pages', () => {
    expect(page).toContain('book: PREVIEW_HOST ? KQ.get("book") : null')
    expect(src).toContain('if (opts.book)')
  })
})
