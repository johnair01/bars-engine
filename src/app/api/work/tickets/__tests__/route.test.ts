import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ workTicket: { findMany: vi.fn(), update: vi.fn() } }))
vi.mock('@/lib/db', () => ({ db: dbm }))

import { GET, PATCH } from '../route'

const get = (query: string) => ({
  nextUrl: { searchParams: new URLSearchParams(query) },
  headers: new Headers({ authorization: 'Bearer menu' }),
}) as never

describe('GET /api/work/tickets', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'menu'
    dbm.workTicket.findMany.mockResolvedValue([])
  })

  it('finds the tickets that name given rows, in any state', async () => {
    expect((await GET(get('rows=ab-look-1, cd-look-2'))).status).toBe(200)
    const arg = dbm.workTicket.findMany.mock.calls[0][0]
    expect(arg.where.OR).toEqual([
      { basis: { path: ['rows'], array_contains: ['ab-look-1'] } },
      { basis: { path: ['rows'], array_contains: ['cd-look-2'] } },
    ])
    expect(arg.take).toBe(200)
  })

  it('keeps the lane and state listing as it was', async () => {
    await GET(get('lane=claude&state=ready'))
    const arg = dbm.workTicket.findMany.mock.calls[0][0]
    expect(arg.where).toEqual({ lane: 'claude', state: 'ready' })
    expect(arg.take).toBe(50)
  })
})

describe('PATCH /api/work/tickets', () => {
  const patch = (body: unknown, token = 'menu') => ({
    headers: new Headers({ authorization: `Bearer ${token}` }),
    json: async () => body,
  }) as never

  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'menu'
  })

  it('records the draft on every ticket that names the row', async () => {
    dbm.workTicket.findMany.mockResolvedValue([{ id: 't1', basis: { rows: ['hq-talk-look-2'] } }])
    const url = 'https://github.com/johnair01/bars-engine/pull/834'
    const res = await PATCH(patch({ rows: ['hq-talk-look-2'], draft: { url, label: 'bars-engine #834' } }))
    expect(res.status).toBe(200)
    expect(dbm.workTicket.update.mock.calls[0][0].data.basis).toEqual({ rows: ['hq-talk-look-2'], draft: { url, label: 'bars-engine #834' } })
  })

  it('refuses a link that is not a github pull request, and a caller without the token', async () => {
    expect((await PATCH(patch({ rows: ['a'], draft: { url: 'https://example.com/x' } }))).status).toBe(400)
    expect((await PATCH(patch({ rows: ['a'], draft: { url: 'https://github.com/a/b/pull/1' } }, 'wrong'))).status).toBe(401)
  })
})
