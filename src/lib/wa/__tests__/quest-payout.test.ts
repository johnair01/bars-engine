import { describe, expect, it, vi } from 'vitest'
import { signJwt } from '../jwt'
import { bountyFor } from '../quest-table'
import { payQuestBounty } from '../quest-payout'
import { userIdentifierFromRoomToken } from '../room-token'

describe('quest table', () => {
  it('has no bounty until an amount is set', () => {
    expect(bountyFor('first-light', {})).toBeNull()
    expect(bountyFor('first-light', { WA_QUEST_BOUNTY_FIRST_LIGHT: 'abc' })).toBeNull()
    expect(bountyFor('first-light', { WA_QUEST_BOUNTY_FIRST_LIGHT: '0' })).toBeNull()
    expect(bountyFor('first-light', { WA_QUEST_BOUNTY_FIRST_LIGHT: '500' })).toBeNull()
    expect(bountyFor('first-light', { WA_QUEST_BOUNTY_FIRST_LIGHT: '2' })).toBe(2)
    expect(bountyFor('nope', { WA_QUEST_BOUNTY_FIRST_LIGHT: '2' })).toBeNull()
  })
})

describe('room token', () => {
  const now = Math.floor(Date.now() / 1000)
  it('reads the identifier of a validly signed token', () => {
    const t = signJwt({ identifier: 'p1', exp: now + 60 }, 's3cret')
    expect(userIdentifierFromRoomToken(t, 's3cret')).toEqual({ ok: true, userIdentifier: 'p1' })
  })
  it('refuses a wrong secret, a missing token and an unset secret', () => {
    const t = signJwt({ identifier: 'p1', exp: now + 60 }, 'other')
    expect(userIdentifierFromRoomToken(t, 's3cret')).toMatchObject({ ok: false, status: 401 })
    expect(userIdentifierFromRoomToken(undefined, 's3cret')).toMatchObject({ ok: false, status: 401 })
    expect(userIdentifierFromRoomToken(t, '')).toMatchObject({ ok: false, status: 503 })
  })
})

function fakeDb(existing: boolean) {
  const tx = {
    $executeRaw: vi.fn(async () => 1),
    vibulonEvent: { findFirst: vi.fn(async () => (existing ? { id: 'e' } : null)), create: vi.fn(async () => ({})) },
    vibulon: { create: vi.fn(async () => ({ id: 'v', originSource: 'wa_quest', originId: 'first-light', originTitle: 't', energy: null })) },
    vibulonMark: { createMany: vi.fn(async () => ({ count: 1 })) },
  }
  return { tx, db: { $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx) } as never }
}

describe('payQuestBounty', () => {
  it('mints the amount once and writes one event', async () => {
    const { tx, db } = fakeDb(false)
    const r = await payQuestBounty(db, { playerId: 'p1', questId: 'first-light', title: 'Light a banner', amount: 3 })
    expect(r).toEqual({ paid: true, amount: 3 })
    expect(tx.vibulon.create).toHaveBeenCalledTimes(3)
    expect(tx.vibulonEvent.create).toHaveBeenCalledTimes(1)
    expect(tx.vibulonMark.createMany).toHaveBeenCalledTimes(3)
  })
  it('pays nothing the second time', async () => {
    const { tx, db } = fakeDb(true)
    const r = await payQuestBounty(db, { playerId: 'p1', questId: 'first-light', title: 'Light a banner', amount: 3 })
    expect(r).toEqual({ paid: false, already: true })
    expect(tx.vibulon.create).not.toHaveBeenCalled()
  })
})
