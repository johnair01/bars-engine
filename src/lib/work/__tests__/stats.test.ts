import { describe, expect, it } from 'vitest'
import { summarise, type DoneTicket } from '../stats'

const at = (iso: string) => new Date(iso)
const done = (lane: string, attempts: number, hours: number, result: string | null): DoneTicket => ({
  lane, attempts, createdAt: at('2026-11-01T00:00:00Z'),
  doneAt: new Date(at('2026-11-01T00:00:00Z').getTime() + hours * 3_600_000), result,
})

describe('lane stats', () => {
  it('measures one lane without the other lane in the numbers', () => {
    const counts = [{ lane: 'claude', state: 'ready', n: 4 }, { lane: 'deepai', state: 'claimed', n: 1 }]
    const rows = summarise(counts, [done('claude', 1, 2, 'https://github.com/x/y/pull/1')], ['claude', 'deepai'])
    expect(rows[0]).toMatchObject({ lane: 'claude', ready: 4, claimed: 0, done: 1, attemptsMedian: 1,
      attemptsMax: 1, hoursMedian: 2, linkedShare: 1 })
    expect(rows[1]).toMatchObject({ lane: 'deepai', ready: 0, claimed: 1, done: 0, attemptsMedian: null,
      linkedShare: null, lastDoneAt: null })
  })

  it('reads attempts and hours as medians, so one abandoned ticket does not decide the lane', () => {
    const rows = summarise([], [done('freebuff', 1, 1, 'https://x/1'), done('freebuff', 1, 2, 'https://x/2'),
      done('freebuff', 9, 40, null)], ['freebuff'])
    expect(rows[0]).toMatchObject({ done: 3, attemptsMedian: 1, attemptsMax: 9, hoursMedian: 2, linkedShare: 0.67 })
  })

  it('counts a done ticket with no link as unlinked, not as missing', () => {
    const rows = summarise([], [done('deepai', 2, 3, 'done, no pull request')], ['deepai'])
    expect(rows[0].linkedShare).toBe(0)
  })
})
