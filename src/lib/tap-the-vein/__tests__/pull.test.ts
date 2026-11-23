import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PULL_LINE_MAX, PULL_MAX_OFFERS, pullAllowedFor, pullOffers, reRankLocal, splitSentences } from '../pull'

const dir = join(__dirname, 'fixtures')
const write = readFileSync(join(dir, 'free-write.txt'), 'utf8')
const marked: string[] = JSON.parse(readFileSync(join(dir, 'free-write.marked.json'), 'utf8'))

/** mulberry32: a seeded random so the test never flakes. */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('pullOffers (the Challenger’s test)', () => {
  it('hits more hand-marked lines than a seeded random pick of three sentences', () => {
    const hit = (lines: string[]) => lines.filter((l) => marked.includes(l)).length
    const pulled = hit(pullOffers(write).map((o) => o.line))
    const all = splitSentences(write).map((s) => s.text)
    const rand = rng(11)
    let total = 0
    const runs = 500
    for (let r = 0; r < runs; r++) {
      const pick = new Set<number>()
      while (pick.size < 3) pick.add(Math.floor(rand() * all.length))
      total += hit([...pick].map((i) => all[i]))
    }
    const randomMean = total / runs
    expect(pulled).toBeGreaterThanOrEqual(2)
    expect(pulled).toBeGreaterThan(randomMean * 3)
  })

  it('returns at most three offers, each the writer’s own sentence at its own offsets', () => {
    const offers = pullOffers(write)
    expect(offers.length).toBeLessThanOrEqual(PULL_MAX_OFFERS)
    for (const o of offers) {
      expect(write.slice(o.start, o.end)).toContain(o.line.replace(/…$/, ''))
      expect(o.line.length).toBeLessThanOrEqual(PULL_LINE_MAX)
    }
  })

  it('returns [] for an empty or wordless write', () => {
    expect(pullOffers('')).toEqual([])
    expect(pullOffers('   \n\n ')).toEqual([])
    expect(pullOffers('Grey. Quiet. Slow.')).toEqual([])
  })

  it('never re-offers a kept line', () => {
    const first = pullOffers(write)
    const again = pullOffers(write, [first[0].line])
    expect(again.map((o) => o.line)).not.toContain(first[0].line)
  })

  it('trims long sentences to 140 characters and never summarises', () => {
    const long = `I want to ${'finish the long and winding thing '.repeat(10)}today.`
    const [o] = pullOffers(long)
    expect(o.line.length).toBeLessThanOrEqual(PULL_LINE_MAX)
    expect(long).toContain(o.line.replace(/…$/, ''))
  })

  it('breaks ties by position', () => {
    const offers = pullOffers('I need to call Ana now. I need to call Ben now.')
    expect(offers[0].line).toContain('Ana')
  })
})

describe('reRankLocal', () => {
  const offers = pullOffers(write)
  it('is a no-op with no local model set', async () => {
    expect(await reRankLocal(offers, undefined)).toEqual(offers)
  })
  it('refuses a cloud host', async () => {
    expect(await reRankLocal(offers, 'https://api.example.com/v1/chat/completions')).toEqual(offers)
  })
})

describe('pullAllowedFor (Wendell, 2026-11-17: his own book only in this version)', () => {
  it('is on for the admin and off for everyone else', () => {
    expect(pullAllowedFor({ roles: [{ role: { key: 'admin' } }] })).toBe(true)
    expect(pullAllowedFor({ roles: [{ role: { key: 'player' } }] })).toBe(false)
    expect(pullAllowedFor({})).toBe(false)
    expect(pullAllowedFor(null)).toBe(false)
  })
})
