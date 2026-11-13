import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const m = vi.hoisted(() => ({ currentPlayer: vi.fn(), sendToFarm: vi.fn() }))
vi.mock('@/lib/between/store', () => ({ currentPlayer: m.currentPlayer, ensureHome: vi.fn() }))
vi.mock('@/lib/bar-to-work/seeds', () => ({ sendToFarm: m.sendToFarm }))

import { POST } from '../route'

const ctx = { params: Promise.resolve({ id: 'bar1' }) }
const seed = { barId: 'bar1', workType: 'build_from_spec' }

describe('POST /api/bars/[id]/send-to-farm', () => {
  beforeEach(() => vi.resetAllMocks())

  it('401 when nobody is signed in', async () => {
    m.currentPlayer.mockResolvedValue(null)
    expect((await POST(new Request('http://x'), ctx)).status).toBe(401)
  })
  it('201 and the type label when the seed is new, 200 when it was already there', async () => {
    m.currentPlayer.mockResolvedValue({ id: 'p1' })
    m.sendToFarm.mockResolvedValueOnce({ ok: true, seed, created: true })
    const a = await POST(new Request('http://x'), ctx)
    expect(a.status).toBe(201)
    expect((await a.json()).workTypeLabel).toBeTruthy()
    m.sendToFarm.mockResolvedValueOnce({ ok: true, seed, created: false })
    expect((await POST(new Request('http://x'), ctx)).status).toBe(200)
    expect(m.sendToFarm).toHaveBeenCalledWith('p1', 'bar1')
  })
  it('passes the refusal through: no farm or character answers 409 with the sentence', async () => {
    m.currentPlayer.mockResolvedValue({ id: 'p1' })
    m.sendToFarm.mockResolvedValue({ ok: false, status: 409, error: 'Make your character first, then send the BAR to your farm.' })
    const res = await POST(new Request('http://x'), ctx)
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/character/)
  })
})
