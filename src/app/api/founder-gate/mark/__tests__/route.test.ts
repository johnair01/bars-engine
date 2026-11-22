import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const mp = vi.hoisted(() => ({ markPayment: vi.fn() }))
vi.mock('@/lib/founder-gate/mark-payment-server', () => mp)

import { POST } from '../route'

const post = (authorization: string | null, body: unknown) => ({
  nextUrl: { searchParams: new URLSearchParams() },
  headers: new Headers(authorization ? { authorization } : {}),
  json: async () => body,
}) as never

describe('POST /api/founder-gate/mark', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'menu'
  })
  it('refuses a missing or wrong token without marking', async () => {
    expect((await POST(post(null, { note: 'fern-07', amount: 11 }))).status).toBe(401)
    expect((await POST(post('Bearer nope', { note: 'fern-07', amount: 11 }))).status).toBe(401)
    expect(mp.markPayment).not.toHaveBeenCalled()
  })
  it('refuses a bad body with 400', async () => {
    expect((await POST(post('Bearer menu', { note: 'fern-07' }))).status).toBe(400)
  })
  it('marks through markPayment and says what happened', async () => {
    mp.markPayment.mockResolvedValue({ kind: 'no-word' })
    const res = await POST(post('Bearer menu', { note: 'thanks $11', ref: 'venmo 11-21 Doe' }))
    expect(res.status).toBe(200)
    expect(mp.markPayment).toHaveBeenCalledWith({ ref: 'venmo 11-21 Doe', note: 'thanks $11', cents: 1100 })
    expect((await res.json()).say).toMatch(/no payment word/)
  })
})
