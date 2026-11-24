import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))
import { decideFires, shouldWake } from '../tick'

describe('orchestrator tick: how many workers to start', () => {
  const base = { ready: 8, live: 0, dry: false, cooldownOpen: false }
  it('starts up to four when tickets wait and slots are free', () => expect(decideFires(base)).toBe(4))
  it('starts one when one ticket waits', () => expect(decideFires({ ...base, ready: 1 })).toBe(1))
  it('starts none when nothing is ready', () => expect(decideFires({ ...base, ready: 0 })).toBe(0))
  it('respects the eight-worker cap', () => {
    expect(decideFires({ ...base, live: 8 })).toBe(0)
    expect(decideFires({ ...base, live: 7 })).toBe(1)
  })
  it('starts none while the lane is dry or the cooldown is open', () => {
    expect(decideFires({ ...base, dry: true })).toBe(0)
    expect(decideFires({ ...base, cooldownOpen: true })).toBe(0)
  })
})

describe('orchestrator tick: the wake backstop', () => {
  const now = new Date('2026-11-24T20:00:00Z')
  const ago = (m: number) => new Date(now.getTime() - m * 60_000)
  it('wakes when the oldest ready ticket has waited over 20 minutes', () =>
    expect(shouldWake({ oldestReadyAt: ago(21), now, dry: false })).toBe(true))
  it('waits while the ticket is younger than 20 minutes', () =>
    expect(shouldWake({ oldestReadyAt: ago(19), now, dry: false })).toBe(false))
  it('does nothing when no ticket is ready or on a dry run', () => {
    expect(shouldWake({ oldestReadyAt: null, now, dry: false })).toBe(false)
    expect(shouldWake({ oldestReadyAt: ago(90), now, dry: true })).toBe(false)
  })
})
