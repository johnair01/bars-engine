import { beforeEach, describe, expect, it, vi } from 'vitest'
// POST /api/between/:gardenId/turn (Six-faces-council spec friendcraft-deck-2 FR-001, FR-004, FR-010): 200, 401, 403, 409,
// a sealed card's words absent until it opens, the slip and the kept page as private BARs, kept twice making one.
const state = {
  cookie: 'D' as string | null,
  enrolled: new Set(['D', 'O']),
  garden: { id: 'room', inviteToken: 'x', startedById: 'O', data: { kind: 'room', members: { D: {}, O: {} } } } as any,
  items: new Map<string, any>(),
  bars: [] as any[], shares: [] as any[],
}
const deck = { goals: {
  g1: { text: 'A friend who asks', at: 1, cards: { deep: { words: 'Sit with me when I cry', at: 1 } } },
} }
vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (k: string) => (k === 'bars_player_id' && state.cookie ? { value: state.cookie } : undefined) }) }))
vi.mock('@/lib/db', () => {
  const tx = {
    $queryRaw: async () => [],
    betweenItem: {
      findMany: async () => [...state.items].map(([id, data]) => ({ id, data })),
      upsert: async ({ create }: any) => { state.items.set(create.id, create.data); return {} },
      deleteMany: async ({ where }: any) => { state.items.delete(where.id); return {} },
    },
    customBar: { create: async ({ data }: any) => { const b = { id: 'bar' + state.bars.length, ...data }; state.bars.push(b); return { id: b.id } } },
    barShare: { create: async ({ data }: any) => { state.shares.push(data); return {} } },
  }
  return { db: {
    player: { findUnique: async ({ where }: any) => ({ id: where.id, name: where.id }), findMany: async ({ where }: any) => where.id.in.map((id: string) => ({ id, name: id === 'O' ? 'Mara' : 'Wendell' })) },
    betweenGarden: { findUnique: async () => state.garden },
    betweenMember: {
      findUnique: async ({ where }: any) => (where.gardenId_playerId.playerId in state.garden.data.members ? { id: 'm' } : null),
      findMany: async ({ where }: any) => (where.playerId === 'O' ? [{ gardenId: 'homeO', garden: { data: { kind: 'home' } } }] : []),
    },
    betweenPrivate: { findUnique: async () => ({ data: deck }) },
    instanceMembership: { findMany: async ({ where }: any) => (state.enrolled.has(where.playerId) ? [{ instance: { slug: 'friendcraft' } }] : []) },
    $transaction: async (fn: any) => fn(tx),
  } }
})
import { POST } from '@/app/api/between/[gardenId]/turn/route'

const call = async (body: unknown) => {
  const res = await POST(new Request('http://x/api/between/room/turn', { method: 'POST', body: JSON.stringify(body) }) as never, { params: Promise.resolve({ gardenId: 'room' }) })
  return { status: res.status, json: await res.json() }
}
const as = (who: string | null) => { state.cookie = who }

describe('POST /api/between/:gardenId/turn', () => {
  beforeEach(() => {
    as('D'); state.items.clear(); state.bars.length = 0; state.shares.length = 0; state.enrolled = new Set(['D', 'O'])
    state.garden.data = { kind: 'room', members: { D: {}, O: {} } }
  })

  it('answers 401 signed out and 403 for a stranger, a homeroom, or a friend not in Friendcraft', async () => {
    as(null); expect((await call({ do: 'draw' })).status).toBe(401)
    as('Z'); expect((await call({ do: 'draw' })).status).toBe(403)
    as('D'); state.garden.data = { kind: 'home', members: { D: {} } }; expect((await call({ do: 'draw' })).status).toBe(403)
    state.garden.data = { kind: 'room', members: { D: {}, O: {} } }; state.enrolled.delete('O'); expect((await call({ do: 'draw' })).status).toBe(403)
  })

  it('draws a sealed card with no words anywhere, then 409 for a second draw and for a move out of place', async () => {
    const a = await call({ do: 'draw' })
    expect(a.status).toBe(200)
    expect(a.json.turn).toMatchObject({ status: 'sealed', depth: 'deep', owner: 'O', by: 'D' })
    expect(JSON.stringify([a.json, [...state.items.values()]])).not.toContain('cry')
    expect((await call({ do: 'draw' })).status).toBe(409)
    expect((await call({ do: 'offer', turn: a.json.turn.id })).status).toBe(403)
    expect((await call({ do: 'open', turn: a.json.turn.id })).status).toBe(409)
    expect((await call({ do: 'fly' })).status).toBe(400)
  })

  it('ask leaves a slip BAR, private, shared to the owner; offer opens the words; two lines keep it as one BAR, even asked twice', async () => {
    const id = (await call({ do: 'draw' })).json.turn.id
    const asked = await call({ do: 'ask', turn: id })
    expect(asked.status).toBe(200); expect(asked.json.turn.status).toBe('asked')
    expect(state.bars).toHaveLength(1)
    expect(state.bars[0]).toMatchObject({ creatorId: 'D', visibility: 'private' })
    expect(state.shares[0]).toMatchObject({ fromUserId: 'D', toUserId: 'O' })
    expect(JSON.stringify(state.bars[0])).not.toContain('cry')
    as('O')
    const offered = await call({ do: 'offer', turn: id })
    expect(offered.json.turn).toMatchObject({ status: 'open', words: 'Sit with me when I cry', goalText: 'A friend who asks' })
    as('D'); expect((await call({ do: 'line', turn: id, words: 'I will come.' })).json.turn.status).toBe('open')
    as('O'); const kept = await call({ do: 'line', turn: id, words: 'Thank you.' })
    expect(kept.json.turn).toMatchObject({ status: 'kept' })
    expect(state.bars).toHaveLength(2)
    expect(state.bars[1]).toMatchObject({ creatorId: 'O', title: 'Sit with me when I cry', description: 'I will come.\nThank you.', visibility: 'private' })
    expect(state.shares[1]).toMatchObject({ fromUserId: 'O', toUserId: 'D' })
    expect((await call({ do: 'line', turn: id, words: 'again' })).status).toBe(409)
    expect(state.bars).toHaveLength(2)
  })

  it('tea: refused without bowls, spends with them, and not today gives them back', async () => {
    const id = (await call({ do: 'draw' })).json.turn.id
    await call({ do: 'earn', turn: id })
    expect((await call({ do: 'open', turn: id })).status).toBe(409)
    state.items.set('k1', { kind: 'turn', status: 'kept', keptAt: 1, by: 'D', owner: 'O' })
    state.items.set('k2', { kind: 'turn', status: 'kept', keptAt: 2, by: 'D', owner: 'O' })
    const opened = await call({ do: 'open', turn: id })
    expect(opened.json.turn.status).toBe('opened'); expect(opened.json.turn.words).toBeUndefined()
    expect(state.items.get('s-' + id)).toMatchObject({ kind: 'spend', bowls: 2 })
    as('O'); await call({ do: 'notToday', turn: id })
    expect(state.items.has('s-' + id)).toBe(false)
  })
})
