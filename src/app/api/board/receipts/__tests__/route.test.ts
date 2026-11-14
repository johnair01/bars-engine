import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ boardSave: { create: vi.fn() } }))
const store = vi.hoisted(() => ({ latestDoc: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: dbm }))
vi.mock('@/lib/board/store', () => store)

import { GET, POST } from '../route'

const SHA = '0b61617873a8e202041156a90a11062628b24d21'
const get = (authorization: string | null, query = `sha=${SHA}`) => ({
  nextUrl: { searchParams: new URLSearchParams(query) },
  headers: new Headers(authorization ? { authorization } : {}),
}) as never
const post = (authorization: string | null, body: unknown) => ({
  nextUrl: { searchParams: new URLSearchParams() },
  headers: new Headers(authorization ? { authorization } : {}),
  json: async () => body,
}) as never
const clean = { sha: SHA, passed: 101, failed: 0, skipped: 0, seconds: 151.6 }

describe('/api/board/receipts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'menu'
  })

  it('refuses a missing or wrong token, and a write with the token only in the URL', async () => {
    expect((await GET(get(null))).status).toBe(401)
    expect((await POST(post('Bearer nope', clean))).status).toBe(401)
    expect((await POST(post(null, clean))).status).toBe(401)
  })

  it('stores a receipt on its own board, so the Council Board never reads it', async () => {
    const res = await POST(post('Bearer menu', clean))
    expect(res.status).toBe(201)
    const data = dbm.boardSave.create.mock.calls[0][0].data
    expect(data.board).toBe('browser-receipts')
    expect(data.collection).toBe('receipts')
    expect(data.docId).toBe(SHA)
    expect(data.recordedAt).toBeInstanceOf(Date)
    expect(data.data).toMatchObject(clean)
  })

  it('refuses a malformed receipt', async () => {
    for (const bad of [{ ...clean, sha: 'abc' }, { ...clean, failed: -1 }, { ...clean, skipped: 'none' }, { ...clean, seconds: undefined }, null]) {
      expect((await POST(post('menu', bad))).status).toBe(400)
    }
    expect(dbm.boardSave.create).not.toHaveBeenCalled()
  })

  it('answers the receipt for a sha, 404 when none, 400 for a bad sha', async () => {
    store.latestDoc.mockResolvedValueOnce(clean)
    expect((await (await GET(get('menu'))).json()).receipt.passed).toBe(101)
    expect(store.latestDoc).toHaveBeenCalledWith('browser-receipts', 'receipts', SHA)
    store.latestDoc.mockResolvedValueOnce(null)
    expect((await GET(get('menu'))).status).toBe(404)
    expect((await GET(get('menu', 'sha=zzz'))).status).toBe(400)
  })
})
