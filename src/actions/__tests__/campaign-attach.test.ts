/**
 * TSG Phase 2 — campaign-attach action unit tests.
 *
 * Exercises the decision branches (login, ownership, validation, idempotency,
 * re-target) without a real database by mocking `@/lib/db` and `@/lib/auth`.
 *
 * Registered in vitest.config.ts include list. Run: npm run test:vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── Mock surfaces ────────────────────────────────────────────────────────────

// vi.mock factories are hoisted above imports, so the stubs they reference must
// be created via vi.hoisted (also hoisted) rather than plain top-level consts.
const { mockPlayer, db } = vi.hoisted(() => {
  const mockPlayer = vi.fn<() => Promise<{ id: string } | null>>()
  // A tiny db stub: each method is a vi.fn configured per test.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = {
    customBar: { findUnique: vi.fn(), update: vi.fn() },
    instance: { findFirst: vi.fn(), findMany: vi.fn() },
    instanceMembership: { findMany: vi.fn() },
    contributionAnnotation: { upsert: vi.fn(), deleteMany: vi.fn() },
  }
  // $transaction runs the callback against the same stub (no real tx needed).
  db.$transaction = vi.fn(async (cb: (tx: typeof db) => unknown) => cb(db))
  return { mockPlayer, db }
})

vi.mock('@/lib/auth', () => ({ getCurrentPlayer: () => mockPlayer() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/db', () => ({ db }))

import {
  attachBarToCampaign,
  detachBarFromCampaign,
  listAttachableCampaigns,
} from '@/actions/campaign-attach'

const PLAYER = { id: 'player-1' }
const OTHER_BAR = { id: 'bar-1', creatorId: 'someone-else', title: 'X', campaignRef: null }
const MY_BAR = { id: 'bar-1', creatorId: 'player-1', title: 'My charge', campaignRef: null }

beforeEach(() => {
  vi.clearAllMocks()
  mockPlayer.mockResolvedValue(PLAYER)
  db.$transaction.mockImplementation(async (cb: (tx: typeof db) => unknown) => cb(db))
})

// ─── attachBarToCampaign ────────────────────────────────────────────────────────

describe('attachBarToCampaign', () => {
  it('requires login', async () => {
    mockPlayer.mockResolvedValue(null)
    expect(await attachBarToCampaign({ barId: 'b', campaignRef: 'c' })).toEqual({ needsLogin: true })
  })

  it('rejects missing inputs', async () => {
    const r = await attachBarToCampaign({ barId: '', campaignRef: '' })
    expect(r).toHaveProperty('error')
  })

  it('rejects a BAR the player does not own', async () => {
    db.customBar.findUnique.mockResolvedValue(OTHER_BAR)
    const r = await attachBarToCampaign({ barId: 'bar-1', campaignRef: 'bruised-banana' })
    expect(r).toEqual({ error: 'You can only offer your own BAR to a campaign.' })
  })

  it('rejects an unknown campaign', async () => {
    db.customBar.findUnique.mockResolvedValue(MY_BAR)
    db.instance.findFirst.mockResolvedValue(null)
    const r = await attachBarToCampaign({ barId: 'bar-1', campaignRef: 'nope' })
    expect(r).toEqual({ error: 'That campaign could not be found.' })
  })

  it('attaches: sets campaignRef + upserts a player intent annotation', async () => {
    db.customBar.findUnique.mockResolvedValue(MY_BAR)
    db.instance.findFirst.mockResolvedValue({ campaignRef: 'bruised-banana', slug: 'bb' })
    const r = await attachBarToCampaign({
      barId: 'bar-1',
      campaignRef: 'bruised-banana',
      intentNote: 'Offering this for the residency',
    })
    expect(r).toEqual({ success: true })
    expect(db.customBar.update).toHaveBeenCalledWith({
      where: { id: 'bar-1' },
      data: { campaignRef: 'bruised-banana' },
    })
    const upsertArg = db.contributionAnnotation.upsert.mock.calls[0][0]
    expect(upsertArg.where.campaignRef_actionType_actionId).toEqual({
      campaignRef: 'bruised-banana',
      actionType: 'bar',
      actionId: 'bar-1',
    })
    expect(upsertArg.create.createdById).toBe('player-1')
    expect(upsertArg.create.gmLabel).toBe('Offering this for the residency')
    // no re-target delete on a fresh attach
    expect(db.contributionAnnotation.deleteMany).not.toHaveBeenCalled()
  })

  it('falls back to the BAR title when no intent note is given', async () => {
    db.customBar.findUnique.mockResolvedValue(MY_BAR)
    db.instance.findFirst.mockResolvedValue({ campaignRef: 'bruised-banana', slug: 'bb' })
    await attachBarToCampaign({ barId: 'bar-1', campaignRef: 'bruised-banana' })
    expect(db.contributionAnnotation.upsert.mock.calls[0][0].create.gmLabel).toBe('My charge')
  })

  it('re-targeting clears the stale annotation on the previous campaign', async () => {
    db.customBar.findUnique.mockResolvedValue({ ...MY_BAR, campaignRef: 'old-campaign' })
    db.instance.findFirst.mockResolvedValue({ campaignRef: 'new-campaign', slug: 'nc' })
    await attachBarToCampaign({ barId: 'bar-1', campaignRef: 'new-campaign' })
    expect(db.contributionAnnotation.deleteMany).toHaveBeenCalledWith({
      where: { campaignRef: 'old-campaign', actionType: 'bar', actionId: 'bar-1' },
    })
  })
})

// ─── detachBarFromCampaign ──────────────────────────────────────────────────────

describe('detachBarFromCampaign', () => {
  it('requires login', async () => {
    mockPlayer.mockResolvedValue(null)
    expect(await detachBarFromCampaign({ barId: 'b' })).toEqual({ needsLogin: true })
  })

  it('is a no-op (success) when the BAR has no campaign', async () => {
    db.customBar.findUnique.mockResolvedValue(MY_BAR)
    const r = await detachBarFromCampaign({ barId: 'bar-1' })
    expect(r).toEqual({ success: true })
    expect(db.customBar.update).not.toHaveBeenCalled()
  })

  it('clears campaignRef and removes the annotation', async () => {
    db.customBar.findUnique.mockResolvedValue({ ...MY_BAR, campaignRef: 'bruised-banana' })
    const r = await detachBarFromCampaign({ barId: 'bar-1' })
    expect(r).toEqual({ success: true })
    expect(db.contributionAnnotation.deleteMany).toHaveBeenCalledWith({
      where: { campaignRef: 'bruised-banana', actionType: 'bar', actionId: 'bar-1' },
    })
    expect(db.customBar.update).toHaveBeenCalledWith({
      where: { id: 'bar-1' },
      data: { campaignRef: null },
    })
  })
})

// ─── listAttachableCampaigns ────────────────────────────────────────────────────

describe('listAttachableCampaigns', () => {
  it('returns [] for logged-out callers', async () => {
    mockPlayer.mockResolvedValue(null)
    expect(await listAttachableCampaigns()).toEqual([])
  })

  it('lists the campaigns the player belongs to (canonical ref, de-duped)', async () => {
    db.instanceMembership.findMany.mockResolvedValue([
      { instance: { name: 'Bruised Banana', slug: 'bb', campaignRef: 'bruised-banana' } },
      { instance: { name: 'Bruised Banana', slug: 'bb', campaignRef: 'bruised-banana' } },
      { instance: { name: 'Slug Only', slug: 'slug-only', campaignRef: null } },
    ])
    const r = await listAttachableCampaigns()
    expect(r).toEqual([
      { ref: 'bruised-banana', name: 'Bruised Banana' },
      { ref: 'slug-only', name: 'Slug Only' },
    ])
  })

  it('falls back to tracked campaigns when the player has no memberships', async () => {
    db.instanceMembership.findMany.mockResolvedValue([])
    db.instance.findMany.mockResolvedValue([
      { name: 'Bruised Banana', slug: 'bb', campaignRef: 'bruised-banana' },
    ])
    const r = await listAttachableCampaigns()
    expect(r).toEqual([{ ref: 'bruised-banana', name: 'Bruised Banana' }])
    expect(db.instance.findMany).toHaveBeenCalled()
  })
})
