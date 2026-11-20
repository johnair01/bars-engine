import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))
import { decideFires } from '../tick'

describe('orchestrator tick: how many workers to start', () => {
  const base = { ready: 8, live: 0, dry: false, cooldownOpen: false }
  it('starts up to two when tickets wait and slots are free', () => expect(decideFires(base)).toBe(2))
  it('starts one when one ticket waits', () => expect(decideFires({ ...base, ready: 1 })).toBe(1))
  it('starts none when nothing is ready', () => expect(decideFires({ ...base, ready: 0 })).toBe(0))
  it('respects the four-worker cap', () => {
    expect(decideFires({ ...base, live: 4 })).toBe(0)
    expect(decideFires({ ...base, live: 3 })).toBe(1)
  })
  it('starts none while the lane is dry or the cooldown is open', () => {
    expect(decideFires({ ...base, dry: true })).toBe(0)
    expect(decideFires({ ...base, cooldownOpen: true })).toBe(0)
  })
})

import { tickEnv, tickLockLane, fireText, TICK_LANES } from '../tick'

describe('orchestrator tick: lanes', () => {
  it('feeds Claude first, then Freebuff', () => expect([...TICK_LANES]).toEqual(['claude', 'freebuff']))
  it('reads each lane from its own settings', () => {
    process.env.WORKER_ROUTINE_FIRE_URL = 'https://c'; process.env.WORKER_ROUTINE_TOKEN = 'tc'
    process.env.WORKER_ROUTINE_FIRE_URL_FREEBUFF = 'https://f'; process.env.WORKER_ROUTINE_TOKEN_FREEBUFF = 'tf'
    expect(tickEnv('claude')).toEqual({ url: 'https://c', token: 'tc' })
    expect(tickEnv('freebuff')).toEqual({ url: 'https://f', token: 'tf' })
  })
  it('keeps a separate cooldown per lane', () => {
    expect(tickLockLane('claude')).toBe('tick:claude')
    expect(tickLockLane('freebuff')).toBe('tick:freebuff')
  })
  it('names the lane in what the worker is told', () => expect(fireText('freebuff', 90, 0, 2)).toContain('90 ready in the freebuff lane'))
})
