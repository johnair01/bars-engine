/**
 * TSG Phase 3 — milestone authoring action unit tests.
 *
 * Exercises propose / updateMilestoneCraft / approveMilestone branches
 * (login, validation, ownership/steward gating, celebration-marker sync,
 * idempotent approve) with db, auth, and the steward check mocked.
 *
 * Registered in vitest.config.ts include list. Run: npm run test:vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockPlayer, mockCanSteward, db } = vi.hoisted(() => {
  const mockPlayer = vi.fn<() => Promise<{ id: string } | null>>()
  const mockCanSteward = vi.fn<() => Promise<boolean>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = {
    instance: { findFirst: vi.fn() },
    campaignMilestone: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    campaignMilestoneMarker: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  }
  db.$transaction = vi.fn(async (cb: (tx: typeof db) => unknown) => cb(db))
  return { mockPlayer, mockCanSteward, db }
})

vi.mock('@/lib/auth', () => ({ getCurrentPlayer: () => mockPlayer() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/actions/donation-cta', () => ({
  assertCanEditInstanceDonation: () => mockCanSteward(),
}))

import {
  proposeMilestone,
  updateMilestoneCraft,
  approveMilestone,
} from '@/actions/campaign-milestone-authoring'

const PLAYER = { id: 'player-1' }

beforeEach(() => {
  vi.clearAllMocks()
  mockPlayer.mockResolvedValue(PLAYER)
  mockCanSteward.mockResolvedValue(true)
  db.$transaction.mockImplementation(async (cb: (tx: typeof db) => unknown) => cb(db))
  db.instance.findFirst.mockResolvedValue({ id: 'inst-1' })
  db.campaignMilestoneMarker.findFirst.mockResolvedValue(null)
})

// ─── proposeMilestone ───────────────────────────────────────────────────────────

describe('proposeMilestone', () => {
  it('requires login', async () => {
    mockPlayer.mockResolvedValue(null)
    expect(await proposeMilestone({ campaignRef: 'c', title: 't', description: '', targetValue: 1 }))
      .toEqual({ needsLogin: true })
  })

  it('rejects an empty title', async () => {
    const r = await proposeMilestone({ campaignRef: 'bb', title: '  ', description: '', targetValue: 5 })
    expect(r).toHaveProperty('error')
  })

  it('rejects a non-positive target', async () => {
    const r = await proposeMilestone({ campaignRef: 'bb', title: 'Reach', description: '', targetValue: 0 })
    expect(r).toEqual({ error: 'Set a positive target.' })
  })

  it('rejects an unknown campaign', async () => {
    db.instance.findFirst.mockResolvedValue(null)
    const r = await proposeMilestone({ campaignRef: 'nope', title: 'Reach', description: '', targetValue: 5 })
    expect(r).toEqual({ error: 'That campaign could not be found.' })
  })

  it('creates a proposed milestone (proposer = current player), no marker without celebration', async () => {
    db.campaignMilestone.create.mockResolvedValue({
      id: 'm-1', campaignRef: 'bruised-banana', title: 'Reach', targetValue: 8,
    })
    const r = await proposeMilestone({
      campaignRef: 'bruised-banana', title: 'Reach', description: 'why', targetValue: 8,
    })
    expect(r).toEqual({ milestoneId: 'm-1' })
    const createArg = db.campaignMilestone.create.mock.calls[0][0]
    expect(createArg.data.status).toBe('proposed')
    expect(createArg.data.proposedByPlayerId).toBe('player-1')
    expect(db.campaignMilestoneMarker.create).not.toHaveBeenCalled()
  })

  it('creates a celebration marker when celebration is provided (triggerCount = rounded target)', async () => {
    db.campaignMilestone.create.mockResolvedValue({
      id: 'm-2', campaignRef: 'bruised-banana', title: 'Reach', targetValue: 8,
    })
    await proposeMilestone({
      campaignRef: 'bruised-banana', title: 'Reach', description: 'why', targetValue: 8,
      celebration: 'We throw a party!',
    })
    const markerArg = db.campaignMilestoneMarker.create.mock.calls[0][0]
    expect(markerArg.data.triggerCount).toBe(8)
    expect(markerArg.data.narrativeText).toBe('We throw a party!')
    expect(markerArg.data.name).toBe('milestone:m-2')
    expect(markerArg.data.status).toBe('active')
  })
})

// ─── updateMilestoneCraft ─────────────────────────────────────────────────────────

describe('updateMilestoneCraft', () => {
  const EXISTING = {
    id: 'm-1', campaignRef: 'bruised-banana', title: 'Old', targetValue: 8, proposedByPlayerId: 'player-1',
  }

  it('lets the proposer edit even without steward rights', async () => {
    db.campaignMilestone.findUnique.mockResolvedValue(EXISTING)
    mockCanSteward.mockResolvedValue(false)
    const r = await updateMilestoneCraft({ milestoneId: 'm-1', title: 'New' })
    expect(r).toEqual({ success: true })
    expect(db.campaignMilestone.update).toHaveBeenCalledWith({
      where: { id: 'm-1' }, data: { title: 'New' },
    })
  })

  it('blocks a non-proposer non-steward', async () => {
    db.campaignMilestone.findUnique.mockResolvedValue({ ...EXISTING, proposedByPlayerId: 'other' })
    mockCanSteward.mockResolvedValue(false)
    const r = await updateMilestoneCraft({ milestoneId: 'm-1', title: 'New' })
    expect(r).toEqual({ error: 'You do not have permission to edit this milestone.' })
  })

  it('retires the celebration marker when celebration is cleared to empty', async () => {
    db.campaignMilestone.findUnique.mockResolvedValue(EXISTING)
    db.campaignMilestoneMarker.findFirst.mockResolvedValue({ id: 'mk-1' })
    const r = await updateMilestoneCraft({ milestoneId: 'm-1', celebration: '' })
    expect(r).toEqual({ success: true })
    expect(db.campaignMilestoneMarker.update).toHaveBeenCalledWith({
      where: { id: 'mk-1' }, data: { status: 'retired' },
    })
  })
})

// ─── approveMilestone ─────────────────────────────────────────────────────────────

describe('approveMilestone', () => {
  it('requires steward rights', async () => {
    db.campaignMilestone.findUnique.mockResolvedValue({ id: 'm-1', campaignRef: 'bb', status: 'proposed' })
    mockCanSteward.mockResolvedValue(false)
    const r = await approveMilestone({ milestoneId: 'm-1' })
    expect(r).toEqual({ error: 'Only a steward can approve a milestone.' })
  })

  it('activates a proposed milestone with approver + timestamp', async () => {
    db.campaignMilestone.findUnique.mockResolvedValue({ id: 'm-1', campaignRef: 'bb', status: 'proposed' })
    const r = await approveMilestone({ milestoneId: 'm-1' })
    expect(r).toEqual({ success: true })
    const updateArg = db.campaignMilestone.update.mock.calls[0][0]
    expect(updateArg.data.status).toBe('active')
    expect(updateArg.data.approvedByPlayerId).toBe('player-1')
    expect(updateArg.data.approvedAt).toBeInstanceOf(Date)
  })

  it('is idempotent when already active', async () => {
    db.campaignMilestone.findUnique.mockResolvedValue({ id: 'm-1', campaignRef: 'bb', status: 'active' })
    const r = await approveMilestone({ milestoneId: 'm-1' })
    expect(r).toEqual({ success: true })
    expect(db.campaignMilestone.update).not.toHaveBeenCalled()
  })
})
