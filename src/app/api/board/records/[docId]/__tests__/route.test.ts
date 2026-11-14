import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ boardSave: { findFirst: vi.fn() } }))
vi.mock('@/lib/db', () => ({ db: dbm }))

import { GET } from '../route'

const req = (token: string | null = 'secret', q = '') => ({
  nextUrl: { searchParams: new URLSearchParams(q) },
  headers: new Headers(token ? { authorization: `Bearer ${token}` } : {}),
}) as never

describe('/api/board/records/[docId]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'secret'
  })

  it('serves the exact body of a known record', async () => {
    const data = { kind: 'callsheet', path: 'council/callsheets/x.md', body: '# x' }
    dbm.boardSave.findFirst.mockResolvedValue({ data, receivedAt: new Date('2026-11-07T00:00:00Z') })
    const res = await GET(req(), { params: Promise.resolve({ docId: 'x' }) })
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual(data)
  })

  it('answers 404 for an unknown docId and 401 without the token', async () => {
    dbm.boardSave.findFirst.mockResolvedValue(null)
    expect((await GET(req(), { params: Promise.resolve({ docId: 'nope' }) })).status).toBe(404)
    expect((await GET(req(null), { params: Promise.resolve({ docId: 'x' }) })).status).toBe(401)
  })
})
