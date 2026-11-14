import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ workTicket: { findMany: vi.fn() } }))
vi.mock('@/lib/db', () => ({ db: dbm }))

import { GET } from '../route'

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
