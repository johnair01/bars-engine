/**
 * The /introductions consent box, tested as a result rather than a mechanism.
 *
 * "Is the sync call inside an if" is the mechanism. "Does someone who left the
 * box unticked end up on the mailing list" is the result, and only the second
 * one is the check. The lead itself is stored either way, before any sync.
 *
 * Registered in vitest.config.ts include list. Run: npm run test:vitest
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock factories are hoisted above imports, so the stubs they reference are
// created with vi.hoisted rather than as plain top-level consts.
const { db, addToList } = vi.hoisted(() => ({
  db: { tourIntroduction: { create: vi.fn() } },
  addToList: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/esp/resend-list', () => ({ addToList }))

import { submitIntroduction } from '@/actions/introductions'

const LEAD = {
  place: 'Powell’s Books',
  city: 'Portland',
  kind: 'bookstore',
  canIntroduce: false,
  submitterName: 'Sam Rivera',
  submitterEmail: '  Sam@Example.com ',
}

beforeEach(() => {
  vi.clearAllMocks()
  db.tourIntroduction.create.mockResolvedValue({ id: 'intro-1' })
  addToList.mockResolvedValue({ ok: true, skipped: true, reason: 'test' })
})

// ── Ticked: stored, then copied to the list ─────────────────────────────────

describe('submitIntroduction with consent', () => {
  it('stores the lead, then adds the submitter to the introductions list', async () => {
    const result = await submitIntroduction({ ...LEAD, consent: true })

    expect(result.ok).toBe(true)
    expect(db.tourIntroduction.create).toHaveBeenCalledTimes(1)
    expect(db.tourIntroduction.create.mock.calls[0][0].data).toMatchObject({
      submitterEmail: 'sam@example.com',
      consent: true,
    })

    expect(addToList).toHaveBeenCalledTimes(1)
    expect(addToList).toHaveBeenCalledWith({
      email: 'sam@example.com',
      firstName: 'Sam',
      list: 'introductions',
    })

    // Persist-then-send: the row is written before the list hears about it.
    expect(db.tourIntroduction.create.mock.invocationCallOrder[0]).toBeLessThan(
      addToList.mock.invocationCallOrder[0],
    )
  })
})

// ── Unticked: stored, and the list never hears about it ─────────────────────

describe('submitIntroduction without consent', () => {
  it('stores the lead with consent false and leaves the list alone', async () => {
    const result = await submitIntroduction({ ...LEAD, consent: false })

    expect(result.ok).toBe(true)
    expect(db.tourIntroduction.create).toHaveBeenCalledTimes(1)
    expect(db.tourIntroduction.create.mock.calls[0][0].data).toMatchObject({
      submitterEmail: 'sam@example.com',
      consent: false,
    })
    expect(addToList).not.toHaveBeenCalled()
  })

  it('reads only a literal true as consent', async () => {
    // A server action accepts whatever a caller posts. A truthy string must not
    // pass for a ticked box, and the row must agree with what the sync did.
    const result = await submitIntroduction({
      ...LEAD,
      consent: 'yes' as unknown as boolean,
    })

    expect(result.ok).toBe(true)
    expect(db.tourIntroduction.create.mock.calls[0][0].data.consent).toBe(false)
    expect(addToList).not.toHaveBeenCalled()
  })
})

// ── A failed save sends nothing ─────────────────────────────────────────────

describe('submitIntroduction when the save fails', () => {
  it('returns an error and skips the sync even with consent', async () => {
    db.tourIntroduction.create.mockRejectedValue(new Error('db down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await submitIntroduction({ ...LEAD, consent: true })

    expect(result.ok).toBe(false)
    expect(addToList).not.toHaveBeenCalled()
  })
})
