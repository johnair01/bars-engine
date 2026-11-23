import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const m = vi.hoisted(() => ({ owner: false, beat: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: async () => m.owner }))
vi.mock('@/lib/work/queue', () => ({ beatLane: m.beat }))
vi.mock('@/lib/work/lanes', () => ({
  LANES: ['claude', 'zo'], isLane: (v: string) => ['claude', 'zo'].includes(v), laneCaller: (r: { ok?: boolean }) => !!r.ok,
}))

import { POST } from '../route'

const req = (body: unknown, ok = true) => ({ ok, headers: new Headers(), json: async () => body }) as never
const ctx = (lane: string) => ({ params: Promise.resolve({ lane }) })

describe('POST /api/work/lanes/:lane/beat', () => {
  beforeEach(() => {
    m.owner = false
    m.beat.mockReset().mockResolvedValue({ lane: 'zo', note: 'tick ok', beatAt: 'now' })
  })

  it('writes the note for a lane caller', async () => {
    const res = await POST(req({ note: ' tick 11:40 ok ' }), ctx('zo'))
    expect(res.status).toBe(200)
    expect(m.beat.mock.calls[0][1]).toBe('zo')
    expect(m.beat.mock.calls[0][2]).toBe('tick 11:40 ok')
  })

  it('turns away a caller with no token', async () => {
    expect((await POST(req({ note: 'x' }, false), ctx('zo'))).status).toBe(401)
    expect(m.beat).not.toHaveBeenCalled()
  })

  it('refuses an empty note and an unknown lane', async () => {
    expect((await POST(req({ note: '  ' }), ctx('zo'))).status).toBe(400)
    expect((await POST(req({ note: 'x' }), ctx('nope'))).status).toBe(404)
  })
})
