import { describe, expect, it, vi } from 'vitest'
import { claimTicket } from '../queue'
import { LANE_WORKERS, LEASE_MS } from '../lanes'

const now = new Date('2026-11-19T00:00:00Z')
function db(live: number) {
  const queryRaw = vi.fn(async () => [{ id: 't1' }])
  return {
    queryRaw,
    db: {
      workTicket: { updateMany: vi.fn(async () => ({ count: 0 })), count: vi.fn(async () => live) },
      $queryRaw: queryRaw,
    } as never,
  }
}

describe('the per-lane worker cap', () => {
  it('holds a lease for six hours', () => {
    expect(LEASE_MS).toBe(6 * 60 * 60 * 1000)
  })
  it('refuses a claim when the lane already holds its live claims', async () => {
    const { db: d, queryRaw } = db(LANE_WORKERS)
    expect(await claimTicket(d, 'claude', 'pickup routine', now)).toBeNull()
    expect(queryRaw).not.toHaveBeenCalled()
  })
  it('takes a claim while the lane has a free worker', async () => {
    const { db: d, queryRaw } = db(LANE_WORKERS - 1)
    expect(await claimTicket(d, 'claude', 'pickup routine', now)).toMatchObject({ id: 't1' })
    expect(queryRaw).toHaveBeenCalledTimes(1)
  })
  it('lets the settle pass claim a ticket only to close it, even in a full lane', async () => {
    const { db: d } = db(LANE_WORKERS + 10)
    expect(await claimTicket(d, 'claude', 'settle', now, 'x')).toMatchObject({ id: 't1' })
  })
})
