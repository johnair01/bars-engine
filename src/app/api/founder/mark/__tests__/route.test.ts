import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const eng = vi.hoisted(() => ({ markPayment: vi.fn(), previewNote: vi.fn() }))
vi.mock('@/lib/founder-gate/mark-payment-server', () => eng)

import { GET, POST } from '../route'

const get = (authorization: string | null, query: string) => ({
  nextUrl: { searchParams: new URLSearchParams(query) },
  headers: new Headers(authorization ? { authorization } : {}),
}) as never
const post = (authorization: string | null, body: unknown) => ({
  nextUrl: { searchParams: new URLSearchParams() },
  headers: new Headers(authorization ? { authorization } : {}),
  json: async () => body,
}) as never
const good = { note: 'for the book fern-07', cents: 1100, ref: 'venmo 2026-11-23 J. Doe' }

describe('/api/founder/mark', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'menu'
  })

  it('refuses a missing or wrong token and writes nothing', async () => {
    expect((await POST(post(null, good))).status).toBe(401)
    expect((await POST(post('Bearer nope', good))).status).toBe(401)
    expect((await GET(get('Bearer nope', 'note=x'))).status).toBe(401)
    expect(eng.markPayment).not.toHaveBeenCalled()
  })

  it('marks a note that names a player', async () => {
    eng.markPayment.mockResolvedValue({ kind: 'marked', word: 'fern-07', playerId: 'p1', cents: 1100, ref: good.ref })
    const res = await POST(post('Bearer menu', good))
    expect(res.status).toBe(201)
    expect(eng.markPayment).toHaveBeenCalledWith(good)
  })

  it('answers 200 on a payment already marked and 422 on a note that marks nothing', async () => {
    eng.markPayment.mockResolvedValueOnce({ kind: 'already', word: 'fern-07', playerId: 'p1', cents: 1100, ref: good.ref })
    expect((await POST(post('Bearer menu', good))).status).toBe(200)
    eng.markPayment.mockResolvedValueOnce({ kind: 'no-word' })
    expect((await POST(post('Bearer menu', { ...good, note: 'thanks' }))).status).toBe(422)
  })

  it('rejects a bad amount or reference before the engine', async () => {
    expect((await POST(post('Bearer menu', { ...good, cents: 11.5 }))).status).toBe(400)
    expect((await POST(post('Bearer menu', { ...good, ref: '' }))).status).toBe(400)
    expect(eng.markPayment).not.toHaveBeenCalled()
  })

  it('previews a note without writing', async () => {
    eng.previewNote.mockResolvedValue({ kind: 'unknown-word', word: 'moss-42' })
    const res = await GET(get('Bearer menu', 'note=moss-42'))
    expect(res.status).toBe(200)
    expect(eng.markPayment).not.toHaveBeenCalled()
  })
})
