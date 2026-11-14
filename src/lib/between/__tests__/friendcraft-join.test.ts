import { beforeEach, describe, expect, it, vi } from 'vitest'
// POST /api/friendcraft/join (Six-faces-council spec .specify/specs/friendcraft-deck FR-003): 200, 401, 403 and twice.
const state = { cookie: 'friend' as string | null, steward: true, garden: { id: 'room1', inviteToken: 'tokentoken1', startedById: 'wendell', data: { phase: 'spark' } } as any, members: new Set<string>(), instance: { id: 'inst1' } as any }
vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (k: string) => (k === 'bars_player_id' && state.cookie ? { value: state.cookie } : undefined) }) }))
vi.mock('@/lib/db', () => ({
  db: {
    player: { findUnique: async ({ where }: any) => (where.id ? { id: where.id, name: where.id } : null) },
    betweenGarden: { findUnique: async () => state.garden },
    betweenMember: { findUnique: async () => null },
    instance: { findUnique: async () => state.instance },
    instanceMembership: {
      findFirst: async () => (state.steward ? { id: 'm' } : null),
      upsert: async ({ create }: any) => { state.members.add(create.playerId); return {} },
      findMany: async ({ where }: any) => (state.members.has(where.playerId) ? [{ instance: { slug: 'friendcraft' } }] : []),
    },
  },
}))
import { POST } from '@/app/api/friendcraft/join/route'

const call = (body: unknown) => POST(new Request('http://x/api/friendcraft/join', { method: 'POST', body: JSON.stringify(body) }) as never)

describe('POST /api/friendcraft/join', () => {
  beforeEach(() => { state.cookie = 'friend'; state.steward = true; state.members.clear(); state.instance = { id: 'inst1' }; state.garden.data = { phase: 'spark' } })

  it('enrols a signed-in friend holding a steward spark\'s live token, and twice changes nothing', async () => {
    const a = await call({ room: 'room1', invite: 'tokentoken1' })
    expect(a.status).toBe(200)
    expect(await a.json()).toEqual({ games: ['friendcraft'] })
    const b = await call({ room: 'room1', invite: 'tokentoken1' })
    expect(b.status).toBe(200)
    expect(state.members.size).toBe(1)
  })

  it('answers 401 when signed out', async () => {
    state.cookie = null
    expect((await call({ room: 'room1', invite: 'tokentoken1' })).status).toBe(401)
  })

  it('answers 403 and enrols no one for a wrong token, a non-steward starter, a closed spark or no instance', async () => {
    expect((await call({ room: 'room1', invite: 'wrongtoken99' })).status).toBe(403)
    state.steward = false
    const r = await call({ room: 'room1', invite: 'tokentoken1' })
    expect(r.status).toBe(403)
    expect((await r.json()).error).toBe('This link does not open Friendcraft.')
    state.steward = true; state.garden.data = { phase: 'closed' }
    expect((await call({ room: 'room1', invite: 'tokentoken1' })).status).toBe(403)
    state.garden.data = { phase: 'spark' }; state.instance = null
    expect((await call({ room: 'room1', invite: 'tokentoken1' })).status).toBe(403)
    expect((await call({})).status).toBe(403)
    expect(state.members.size).toBe(0)
  })
})
