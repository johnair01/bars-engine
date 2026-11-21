import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))
import { decideFires, fireNote } from '../tick'

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

describe('tick beat note', () => {
  it('names a refusal status once', () => expect(fireNote(0, 2, 27, 0, [403, 403])).toBe('fired 0/2 refused 403: 27 ready, 0 live'))
  it('stays plain when every fire worked', () => expect(fireNote(2, 2, 27, 0, [])).toBe('fired 2/2: 27 ready, 0 live'))
})
