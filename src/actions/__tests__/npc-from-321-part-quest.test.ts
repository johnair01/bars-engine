/**
 * npc-from-321 T004 + T006: one coin per met need with the helper as creator, the check-in gated on both steps,
 * promotion only on "met". db is an in-memory stub; the checks read the result (coins, form), not the calls.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = { daemon: null as any, session: null as any, coins: [] as any[], bars: [] as any[], players: [] as any[] }
  const db: any = {
    daemon: {
      findUnique: vi.fn(async () => state.daemon && { ...state.daemon, player: { nationId: null, archetypeId: null } }),
      update: vi.fn(async ({ data }: any) => { Object.assign(state.daemon, data); return state.daemon }),
    },
    shadow321Session: {
      findFirst: vi.fn(async ({ where }: any) => state.session?.linkedQuestId === where.linkedQuestId ? { daemons: [{ id: state.daemon.id }] } : null),
      update: vi.fn(async ({ data }: any) => Object.assign(state.session, data)),
    },
    customBar: { create: vi.fn(async ({ data }: any) => { const b = { id: `bar-${state.bars.length + 1}`, ...data }; state.bars.push(b); return b }) },
    vibulon: { createManyAndReturn: vi.fn(async ({ data }: any) => data.map((d: any) => { const c = { id: `coin-${state.coins.length + 1}`, ...d }; state.coins.push(c); return { id: c.id } })) },
    invite: { findFirst: vi.fn(async () => ({ id: 'inv' })), create: vi.fn() },
    player: { create: vi.fn(async ({ data }: any) => { const p = { id: `npc-${state.players.length + 1}`, ...data }; state.players.push(p); return p }) },
  }
  return { state, db }
})

vi.mock('@/lib/db', () => ({ db: h.db }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getCurrentPlayer: vi.fn(async () => ({ id: 'p1' })) }))
vi.mock('@/actions/charge-metabolism', () => ({ persist321Session: vi.fn() }))

import { checkInPart, markStep, takePartQuest } from '@/actions/npc-from-321'
import { maybePromoteDaemonToNpc } from '@/actions/daemons'
import { mintVibulon } from '@/actions/economy'

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(h.state, {
    daemon: { id: 'd1', playerId: 'p1', name: 'Ilmar', source: '321_raised', level: 1, promotedToPlayerId: null, shadow321SessionId: 's1', innerWorkDigest: { v: 1, finalShadowName: 'The Clerk' } },
    session: { id: 's1', linkedQuestId: null },
    coins: [], bars: [], players: [],
  })
})

describe('mintVibulon creatorId (T004)', () => {
  it('writes creatorId on every coin when given, and returns the ids', async () => {
    const ids = await mintVibulon('p1', 2, { source: 's', id: 'i', title: 't' }, { creatorId: 'p1', skipRevalidate: true })
    expect(ids).toHaveLength(2)
    expect(h.state.coins.every((c) => c.creatorId === 'p1')).toBe(true)
  })
})

describe('the part quest (T006)', () => {
  it('takePartQuest writes a root with three children and links the session; twice gives the same quest', async () => {
    const a = await takePartQuest('d1')
    const b = await takePartQuest('d1')
    expect(a.questId).toBeTruthy()
    expect(b.questId).toBe(a.questId)
    expect(h.state.bars).toHaveLength(4)
    expect(h.state.bars.filter((x) => x.parentId === a.questId)).toHaveLength(3)
    expect(h.state.session.linkedQuestId).toBe(a.questId)
  })

  it('the check-in refuses until both steps are done, and not_yet costs nothing', async () => {
    const { questId } = await takePartQuest('d1')
    expect((await checkInPart('d1', 'met', 'x')).error).toBeTruthy()
    await markStep(questId!, 'life')
    expect((await checkInPart('d1', 'met', 'x')).error).toBeTruthy()
    await markStep(questId!, 'land')
    expect(await checkInPart('d1', 'not_yet')).toEqual({})
    expect(h.state.coins).toHaveLength(0)
    expect(h.state.players).toHaveLength(0)
  })

  it('met mints one coin by the helper and promotes; a second met mints nothing', async () => {
    const { questId } = await takePartQuest('d1')
    await markStep(questId!, 'life')
    await markStep(questId!, 'land')
    const r = await checkInPart('d1', 'met', 'Called my sister')
    expect(r.vibulonId).toBeTruthy()
    expect(r.playerId).toBeTruthy()
    expect(h.state.coins).toHaveLength(1)
    expect(h.state.coins[0]).toMatchObject({ creatorId: 'p1', ownerId: 'p1', originSource: 'npc-from-321', originId: questId })
    expect(h.state.coins[0].originTitle).toContain('Called my sister')
    expect(h.state.players[0]).toMatchObject({ creatorType: 'agent', name: 'Ilmar' })
    const again = await checkInPart('d1', 'met', 'Again')
    expect(again.error).toBeTruthy()
    expect(h.state.coins).toHaveLength(1)
    expect(h.state.players).toHaveLength(1)
  })

  it('met needs a line of what was done', async () => {
    const { questId } = await takePartQuest('d1')
    await markStep(questId!, 'life'); await markStep(questId!, 'land')
    expect((await checkInPart('d1', 'met', '  ')).error).toBeTruthy()
    expect(h.state.coins).toHaveLength(0)
  })

  it('level never promotes a 3-2-1 part', async () => {
    h.state.daemon.level = 9
    await maybePromoteDaemonToNpc('d1')
    expect(h.state.players).toHaveLength(0)
  })
})
