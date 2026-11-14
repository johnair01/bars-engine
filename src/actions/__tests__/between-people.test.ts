/**
 * npc-from-321, Madi's demo: /between/people. The page's read works with no parts and no goals; a quest ties only to
 * her own active goal; a win counts as a spirit's life step only when the goal matches; a setback saves a charge and
 * answers with the 3-2-1 link. db is an in-memory stub; the checks read the state, not the calls.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = { daemons: [] as any[], goals: [] as any[], bars: [] as any[] }
  const db: any = {
    daemon: {
      findMany: vi.fn(async ({ where }: any) => state.daemons.filter((d) => d.playerId === where.playerId && d.source === where.source)),
      findUnique: vi.fn(async ({ where }: any) => state.daemons.find((d) => d.id === where.id) ?? null),
      update: vi.fn(async ({ where, data }: any) => Object.assign(state.daemons.find((d) => d.id === where.id), data)),
    },
    lensGoal: {
      findMany: vi.fn(async ({ where }: any) => state.goals.filter((g) => g.playerId === where.playerId && g.status === where.status)),
      findUnique: vi.fn(async ({ where }: any) => state.goals.find((g) => g.id === where.id) ?? null),
    },
    customBar: {
      findMany: vi.fn(async ({ where }: any) =>
        state.bars.filter((b) => b.creatorId === where.creatorId && (where.type ? b.type === where.type : where.id.in.includes(b.id))),
      ),
      findUnique: vi.fn(async ({ where }: any) => state.bars.find((b) => b.id === where.id) ?? null),
      update: vi.fn(async ({ where, data }: any) => Object.assign(state.bars.find((b) => b.id === where.id), data)),
      create: vi.fn(async ({ data }: any) => {
        const b = { id: `bar-${state.bars.length + 1}`, createdAt: new Date('2026-11-10T12:00:00Z'), ...data }
        state.bars.push(b)
        return b
      }),
    },
  }
  return { state, db }
})

vi.mock('@/lib/db', () => ({ db: h.db }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getCurrentPlayer: vi.fn(async () => ({ id: 'p1' })) }))

import { getMyPeople, recordOuterNews, tiePartQuestToGoal } from '@/actions/between-people'

const spirit = (over: any = {}) => ({
  id: 'd1', playerId: 'p1', name: 'Ilmar', source: '321_raised', promotedToPlayerId: null,
  innerWorkDigest: { finalShadowName: 'The Clerk', part: { questId: 'q1', steps: { life: false, land: false } } },
  shadow321Session: { phase2Snapshot: JSON.stringify({ q5: 'to be heard' }), finalShadowName: 'The Clerk' },
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  h.state.daemons = []
  h.state.goals = []
  h.state.bars = []
})

describe('getMyPeople', () => {
  it('works with no parts and no goals', async () => {
    expect(await getMyPeople()).toEqual({ people: [], goals: [], news: [] })
  })

  it('shows a spirit with its need and the goal its quest serves', async () => {
    h.state.daemons = [spirit()]
    h.state.goals = [{ id: 'g1', playerId: 'p1', status: 'active', title: 'Keep the house', cadence: 'weekly' }]
    h.state.bars = [{ id: 'q1', creatorId: 'p1', type: 'quest', lensGoalId: 'g1' }]
    const r = await getMyPeople()
    if ('error' in r) throw new Error(r.error)
    expect(r.people[0]).toMatchObject({ stage: 'spirit', need: 'to be heard', partName: 'The Clerk', lensGoalId: 'g1', questId: 'q1' })
  })
})

describe('tiePartQuestToGoal', () => {
  it('ties to her own active goal and refuses another player’s goal', async () => {
    h.state.daemons = [spirit()]
    h.state.goals = [
      { id: 'g1', playerId: 'p1', status: 'active' },
      { id: 'g2', playerId: 'p2', status: 'active' },
    ]
    h.state.bars = [{ id: 'q1', creatorId: 'p1', lensGoalId: null }]
    expect(await tiePartQuestToGoal('d1', 'g2')).toEqual({ error: 'Goal not found' })
    expect(await tiePartQuestToGoal('d1', 'g1')).toEqual({ ok: true })
    expect(h.state.bars[0].lensGoalId).toBe('g1')
  })

  it('asks for the quest first', async () => {
    h.state.daemons = [spirit({ innerWorkDigest: {} })]
    expect((await tiePartQuestToGoal('d1', null)).error).toBe('Take the quest first')
  })
})

describe('recordOuterNews', () => {
  beforeEach(() => {
    h.state.daemons = [spirit()]
    h.state.goals = [
      { id: 'g1', playerId: 'p1', status: 'active' },
      { id: 'g3', playerId: 'p1', status: 'active' },
    ]
    h.state.bars = [{ id: 'q1', creatorId: 'p1', lensGoalId: 'g1' }]
  })

  it('a win for the same goal counts as the spirit’s life step', async () => {
    const r = await recordOuterNews({ kind: 'win', line: 'Rent paid on time', lensGoalId: 'g1', daemonId: 'd1' })
    expect(r.countedFor).toBe('Ilmar')
    expect(h.state.daemons[0].innerWorkDigest.part.steps.life).toBe(true)
    expect(h.state.bars.find((b) => b.type === 'outer_news')).toMatchObject({ title: 'Rent paid on time', visibility: 'private' })
  })

  it('a win for another goal does not count and writes nothing', async () => {
    const r = await recordOuterNews({ kind: 'win', line: 'Rent paid', lensGoalId: 'g3', daemonId: 'd1' })
    expect(r.error).toMatch(/does not count/)
    expect(h.state.daemons[0].innerWorkDigest.part.steps.life).toBe(false)
    expect(h.state.bars.filter((b) => b.type === 'outer_news')).toHaveLength(0)
  })

  it('a setback saves a charge on the goal and answers with the 3-2-1 link', async () => {
    const r = await recordOuterNews({ kind: 'setback', line: 'The grant was turned down', lensGoalId: 'g1' })
    const charge = h.state.bars.find((b) => b.type === 'charge_capture')
    expect(charge).toMatchObject({ lensGoalId: 'g1', visibility: 'private', description: 'The grant was turned down' })
    expect(r.redirectUrl).toContain(`/shadow/321?chargeBarId=${charge.id}`)
    expect(r.redirectUrl).toContain(encodeURIComponent('/between/people'))
  })

  it('refuses an empty line and a setback counted as a step', async () => {
    expect((await recordOuterNews({ kind: 'win', line: '  ' })).error).toBeTruthy()
    expect((await recordOuterNews({ kind: 'setback', line: 'x', daemonId: 'd1' })).error).toBe('Only a win counts as a step')
    expect(h.state.bars).toHaveLength(1)
  })
})
