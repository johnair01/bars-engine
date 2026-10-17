import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({
  boardSave: { findMany: vi.fn(), updateMany: vi.fn() }, boardPull: { create: vi.fn() },
}))
const store = vi.hoisted(() => ({ latestDocs: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: dbm }))
vi.mock('@/lib/board/store', () => store)

import { GET, POST } from '../route'

const get = (q = '', token: string | null = 'secret') => ({
  nextUrl: { searchParams: new URLSearchParams(q) },
  headers: new Headers(token ? { authorization: `Bearer ${token}` } : {}),
}) as never
const post = (body: unknown, token: string | null = 'secret') => ({
  nextUrl: { searchParams: new URLSearchParams() },
  headers: new Headers(token ? { authorization: `Bearer ${token}` } : {}),
  json: async () => body,
}) as never

describe('/api/board/pull', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.BOARD_PULL_TOKEN = 'secret'
    store.latestDocs.mockResolvedValue({ positions: { a: { status: 'stands' } }, pickup: { last: { rows: [] } } })
    dbm.boardSave.findMany.mockResolvedValue([])
    dbm.boardSave.updateMany.mockResolvedValue({ count: 2 })
    dbm.boardPull.create.mockResolvedValue({})
  })

  it('refuses a request without the token', async () => {
    expect((await GET(get('board=council', null))).status).toBe(401)
    expect((await POST(post({ ids: [], record: 'r' }, 'wrong'))).status).toBe(401)
  })

  it('defaults to the nonprofit board', async () => {
    const body = await (await GET(get())).json()
    expect(body.board).toBe('nonprofit')
    expect(store.latestDocs).toHaveBeenCalledWith('nonprofit')
  })

  it('returns every council document and only council saves still waiting', async () => {
    const at = new Date('2026-10-16T10:00:00Z')
    dbm.boardSave.findMany.mockResolvedValue([{ id: 's1', collection: 'morning', docId: 'freewrite', receivedAt: at }])
    const body = await (await GET(get('board=council&stale_hours=6'))).json()
    expect(body.board).toBe('council')
    expect(body.docs.positions.a.status).toBe('stands')
    expect(store.latestDocs).toHaveBeenCalledWith('council')
    expect(dbm.boardSave.findMany.mock.calls[0][0].where).toEqual({ board: 'council', recordedAt: null })
    expect(body.unrecorded).toHaveLength(1)
    expect(body.stale).toHaveLength(1)
  })

  it('rejects a board that is not nonprofit or council', async () => {
    expect((await GET(get('board=other'))).status).toBe(400)
    expect((await POST(post({ board: 'other', ids: ['x'], record: 'r' }))).status).toBe(400)
    expect(dbm.boardSave.updateMany).not.toHaveBeenCalled()
  })

  it('acknowledges council saves on the council board only', async () => {
    const res = await POST(post({ board: 'council', ids: ['s1', 's2'], record: 'six-faces-council@abc recorded' }))
    expect(await res.json()).toEqual({ recorded: 2 })
    expect(dbm.boardSave.updateMany.mock.calls[0][0].where).toEqual({ board: 'council', id: { in: ['s1', 's2'] }, recordedAt: null })
    expect(dbm.boardPull.create.mock.calls[0][0].data.board).toBe('council')
  })

  it('still acknowledges the nonprofit board when no board is named', async () => {
    await POST(post({ ids: ['s1'], record: 'r' }))
    expect(dbm.boardSave.updateMany.mock.calls[0][0].where.board).toBe('nonprofit')
  })
})
