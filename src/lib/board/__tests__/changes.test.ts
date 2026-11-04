import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))

import { foldChanges, SETTLE_MS } from '../store'

const now = Date.parse('2026-11-03T03:00:00Z')
const row = (seq: number, agoMs: number) =>
  ({ seq: BigInt(seq), collection: 'rows', docId: `r${seq}`, data: { seq }, receivedAt: new Date(now - agoMs) })

describe('the change log fold (live board step 2)', () => {
  it('moves the cursor past settled saves and hands them over in order', () => {
    const out = foldChanges([row(5, 60_000), row(6, 30_000)], 4, 200, now)
    expect(out.changes.map((c) => c.seq)).toEqual([5, 6])
    expect(out.next).toBe(6)
    expect(out.more).toBe(false)
  })

  it('keeps the cursor before a save still settling, so the next ask carries it again', () => {
    const out = foldChanges([row(5, 60_000), row(6, SETTLE_MS - 1), row(7, 60_000)], 4, 200, now)
    expect(out.changes.map((c) => c.seq)).toEqual([5, 6, 7])
    expect(out.next).toBe(5)
  })

  it('says more when the limit cut a settled answer', () => {
    const out = foldChanges([row(5, 60_000), row(6, 60_000)], 4, 2, now)
    expect(out).toMatchObject({ next: 6, more: true })
  })

  it('stays where it was when nothing came', () => {
    expect(foldChanges([], 42, 200, now)).toEqual({ changes: [], next: 42, more: false })
  })
})
