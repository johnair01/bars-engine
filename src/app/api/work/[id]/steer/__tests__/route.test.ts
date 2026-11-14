import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
const m = vi.hoisted(() => ({ owner: false, rows: [] as Record<string, unknown>[] }))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: async () => m.owner }))
vi.mock('@/lib/db', () => ({
  db: { workTicket: {
    findUnique: async ({ where }: { where: { id: string } }) => m.rows.find((t) => t.id === where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const t = m.rows.find((x) => x.id === where.id)!; Object.assign(t, data); return t },
  } },
}))
import { POST } from '../route'

const call = (headers: Record<string, string>, body: unknown) => POST(
  new NextRequest('http://localhost/api/work/t1/steer', { method: 'POST', headers, body: JSON.stringify(body) }),
  { params: Promise.resolve({ id: 't1' }) })

describe('POST /api/work/:id/steer', () => {
  beforeEach(() => {
    process.env.COUNCIL_MENU_TOKEN = 'key'
    m.owner = false
    m.rows = [{ id: 't1', state: 'ready', lane: 'claude', lanes: ['claude'], basis: {} }]
  })
  it('turns away a caller with neither the council key nor the owner sign-in', async () => {
    expect((await call({}, { lane: 'freebuff' })).status).toBe(401)
    expect(m.rows[0].lane).toBe('claude')
  })
  it('writes the store at once for the council key', async () => {
    const r = await call({ authorization: 'Bearer key' }, { lane: 'freebuff' })
    expect(r.status).toBe(200)
    expect(m.rows[0]).toMatchObject({ lane: 'freebuff', state: 'ready' })
  })
  it("writes the store at once for the board owner's page, and holds on request", async () => {
    m.owner = true
    expect((await call({}, { lane: 'hold' })).status).toBe(200)
    expect(m.rows[0].state).toBe('held')
  })
  it('answers 409 for a claimed ticket and 400 for a bad lane', async () => {
    m.owner = true
    expect((await call({}, { lane: 'mars' })).status).toBe(400)
    m.rows[0].state = 'claimed'
    expect((await call({}, { lane: 'freebuff' })).status).toBe(409)
  })
})
