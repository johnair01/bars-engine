import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const m = vi.hoisted(() => ({ owner: true, push: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: async () => m.owner }))
vi.mock('@/lib/work/queue', () => ({ pushTicket: m.push }))

import { POST } from '../route'

const post = (body: unknown) => ({
  headers: new Headers(), nextUrl: { host: 'x.test' }, json: async () => body,
}) as never

describe('POST /api/work/send', () => {
  beforeEach(() => {
    m.owner = true
    m.push.mockReset().mockResolvedValue({ created: true, ticket: { id: 't1', lane: 'claude', state: 'ready' } })
  })

  it('saves a Claude-lane ticket whose basis row is harbour:<berth>', async () => {
    const res = await POST(post({ berth: 'fleet' }))
    expect(res.status).toBe(201)
    const t = m.push.mock.calls[0][1]
    expect(t.basis.rows).toEqual(['harbour:fleet'])
    expect(t.lanes[0]).toBe('claude')
    expect(t.brief).toContain('board/waybill.py fleet --line')
  })

  it('turns away anyone but the board owner', async () => {
    m.owner = false
    expect((await POST(post({ berth: 'fleet' }))).status).toBe(401)
    expect(m.push).not.toHaveBeenCalled()
  })

  it('refuses a berth id with odd characters', async () => {
    expect((await POST(post({ berth: 'a b; rm' }))).status).toBe(400)
    expect(m.push).not.toHaveBeenCalled()
  })
})
