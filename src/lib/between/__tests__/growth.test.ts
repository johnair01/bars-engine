import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as G from '../../../../public/between/growth.js'
// the browser module is plain JS; its inferred types are narrower than the tests need
const { read, isFeed, standIn, keptRun, newPot, POTS, TEAS } = G as any

const DAY = 864e5, T0 = 1_700_000_000_000, A = 'a', B = 'b'
const garden = { startedAt: T0, betweenSince: T0 }
const cast = (id: string, answerer: string, at: number) => [id, { kind: 'cast', by: answerer === A ? B : A, at: at - 1, status: 'face-up', answer: { [answerer]: { card: 'c', depth: 'easy', at } } }]
const R = (items: any[], now: number, extra: any = {}) => read({ items: new Map(items), garden, members: [A, B], now, ...extra })

describe('growth: the Between reads its own items', () => {
  it('an empty Between reads exactly as today: health 3, nothing found, no bowls', () => {
    const r = R([], T0 + DAY)
    expect(r).toMatchObject({ health: 3, kept: 0, growth: 0, potsFound: 0, bowls: 0, feeds: [] })
    expect(standIn({ feeds: 0, now: T0 + DAY }).items.size).toBe(0)
  })
  it('agreements held and offerings fed count as built and are not feeds', () => {
    const r = R([['g', { kind: 'agreement', status: 'agreed' }], ['o', { kind: 'offer', status: 'received' }]], T0 + DAY)
    expect(r.health).toBe(Math.round(3 + 1.2 + 0.6)); expect(r.growth).toBe(0)
  })
  it('a cast answered by the other friend is one feed at the answer\'s time; an unanswered one is none', () => {
    expect(isFeed({ kind: 'cast', by: A, at: 1, answer: {} })).toBeNull()
    expect(isFeed({ kind: 'cast', by: A, at: 1, answer: { [A]: { at: 5 } } })).toBeNull() // the tosser cannot feed with their own
    expect(isFeed({ kind: 'cast', by: A, at: 1, answer: { [B]: { at: 5 } } })).toEqual({ kind: 'answer', by: [A, B], at: 5 })
  })
  it('a cup feeds only once drunk; a spirit woken at a hearth feeds; a turn needs both answers', () => {
    expect(isFeed({ kind: 'cup', by: A, at: 1, status: 'poured' })).toBeNull()
    expect(isFeed({ kind: 'cup', by: A, at: 1, status: 'drunk', drunkBy: B, drunkAt: 9 })).toEqual({ kind: 'cup', by: [A, B], at: 9 })
    expect(isFeed({ kind: 'turn', answer: { [A]: { at: 2 } } })).toBeNull()
    expect(isFeed({ kind: 'turn', answer: { [A]: { at: 2 }, [B]: { at: 4 } } })).toEqual({ kind: 'turn', by: [A, B], at: 4 })
    const r = read({ items: [], spirits: [{ owner: A, hearth: true, fromEmber: true, at: T0 + 10 }], garden, members: [A, B], now: T0 + DAY })
    expect(r.growth).toBe(1)
  })
  it('bowls fill one a feed up to three and a spend empties one, without touching health, growth or kept', () => {
    const feeds = [1, 2, 3, 4].map(i => cast('c' + i, A, T0 + i * 1000))
    const full = R(feeds, T0 + DAY), spent = R([...feeds, ['s', { kind: 'spend', at: T0 + 9000 }]], T0 + DAY)
    expect(full.bowls).toBe(3); expect(spent.bowls).toBe(2)
    expect({ ...spent, bowls: 0, feeds: 0 }).toEqual({ ...full, bowls: 0, feeds: 0 })
  })
  it('pots are found at the thresholds, one at a time, and growth never goes down', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => cast('c' + i, A, T0 + i * 1000))
    expect([2, 3, 8, 15, 40].map(n => R(many(n), T0 + DAY).potsFound)).toEqual([0, 1, 2, 3, 4])
    expect(POTS.length).toBe(4); expect(TEAS.length).toBe(5)
    const r = R(many(3), T0 + DAY)
    expect(newPot(r, new Map(many(3)))).toBe(true)
    expect(newPot(r, new Map([...many(3), ['p', { kind: 'cup', tea: 'smoke' }]] as any))).toBe(false)
  })
  it('a day is kept when both friends took part; kept days lift the light', () => {
    const one = R([cast('1', A, T0 + 3600e3)], T0 + 3700e3)
    expect(one.kept).toBe(1) // an exchange between the two: both took part
    const three = R([0, 1, 2].map(d => cast('c' + d, A, T0 + d * DAY + 3600e3)), T0 + 2 * DAY + 7200e3)
    expect(three.kept).toBe(3); expect(three.health).toBeGreaterThan(R([cast('1', A, T0 + 3600e3)], T0 + 2 * DAY + 7200e3).health - 0.01)
  })
  it('one missed day in a run is forgiven once; two break it', () => {
    const k = (ds: number[], today: number) => keptRun(new Set(ds), today).kept
    expect(k([1, 2, 4, 5], 5)).toBe(4)       // day 3 missed, forgiven
    expect(k([0, 1, 3, 5], 5)).toBe(2)       // 4 missed (forgiven), 3 kept, 2 missed again: run is 5,3
    expect(k([1, 2, 3, 4], 5)).toBe(4)       // today not over: yesterday starts the run
    expect(k([1, 2], 5)).toBe(0)             // broken
  })
  it('a lapse settles the lift a step a day and never below the built inputs', () => {
    const base = [0, 1, 2, 3, 4].map(d => cast('c' + d, A, T0 + d * DAY + 3600e3))
    const held = R(base, T0 + 4 * DAY + 7200e3).health
    const l = (n: number) => R(base, T0 + (4 + n) * DAY + 7200e3).health
    expect(l(2)).toBeLessThanOrEqual(held); expect(l(12)).toBeLessThanOrEqual(l(2))
    expect(l(12)).toBe(R([], T0 + 20 * DAY).health + Math.min(5, 0)) // all feeds older than seven days: back to the built inputs
  })
  it('previews: standIn seeds the feeds, the run and the lapse', () => {
    const now = T0 + 40 * DAY, s = (o: object) => read(standIn({ now, ...o }))
    expect(s({ feeds: 9, kept: 4 })).toMatchObject({ growth: 9, potsFound: 2, kept: 4 })
    expect(s({ feeds: 9, kept: 4, lapsed: 3 }).kept).toBe(0)
    expect(s({ feeds: 9, kept: 4, lapsed: 3 }).health).toBeLessThan(s({ feeds: 9, kept: 4 }).health + 1)
  })
  it('reads no clock but the one it is given, and no number is written into the file\'s words', () => {
    const src = readFileSync(path.join(__dirname, '../../../../public/between/growth.js'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    expect(src).not.toMatch(/Date\.now|new Date|getHours|performance\.now|Intl/)
  })
})
