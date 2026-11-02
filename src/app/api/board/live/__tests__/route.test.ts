import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ boardSave: { findMany: vi.fn(), updateMany: vi.fn() }, boardPull: { create: vi.fn() } }))
const store = vi.hoisted(() => ({ latestDocs: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: dbm }))
vi.mock('@/lib/board/store', () => store)

import { GET, POST } from '../route'

const get = (authorization: string | null) => ({
  nextUrl: { searchParams: new URLSearchParams() },
  headers: new Headers(authorization ? { authorization } : {}),
}) as never
const post = (authorization: string | null, body: unknown, query = '') => ({
  nextUrl: { searchParams: new URLSearchParams(query) },
  headers: new Headers(authorization ? { authorization } : {}),
  json: async () => body,
}) as never

describe('/api/board/live', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'menu'
    store.latestDocs.mockResolvedValue({ questions: { q1: { choice: 'A' } } })
    dbm.boardSave.findMany.mockResolvedValue([{ id: 's1', collection: 'questions', docId: 'q1', receivedAt: new Date() }])
  })

  it('refuses a missing or wrong token', async () => {
    expect((await GET(get(null))).status).toBe(401)
    expect((await GET(get('Bearer nope'))).status).toBe(401)
  })

  it('answers the council store and its unrecorded saves for the menu token, bare or bearer', async () => {
    for (const h of ['menu', 'Bearer menu']) {
      const body = await (await GET(get(h))).json()
      expect(body.board).toBe('council')
      expect(body.docs.questions.q1.choice).toBe('A')
      expect(body.unrecorded).toHaveLength(1)
    }
    expect(store.latestDocs).toHaveBeenCalledWith('council')
    expect(dbm.boardSave.findMany.mock.calls[0][0].where).toEqual({ board: 'council', recordedAt: null })
  })

  it('acknowledges council saves for the menu token and logs the pull', async () => {
    dbm.boardSave.updateMany.mockResolvedValue({ count: 2 })
    const res = await POST(post('menu', { ids: ['s1', 's2'], record: 'session read' }))
    expect(res.status).toBe(200)
    expect((await res.json()).recorded).toBe(2)
    const arg = dbm.boardSave.updateMany.mock.calls[0][0]
    expect(arg.where).toEqual({ board: 'council', id: { in: ['s1', 's2'] }, recordedAt: null })
    expect(arg.data.record).toBe('session read')
    expect(dbm.boardPull.create).toHaveBeenCalledWith({ data: { board: 'council', recorded: 2, record: 'session read' } })
  })

  it('refuses a write with a wrong token, a token in the URL, or a bad body', async () => {
    expect((await POST(post('Bearer nope', { ids: [], record: 'x' }))).status).toBe(401)
    expect((await POST(post(null, { ids: [], record: 'x' }, 'token=menu'))).status).toBe(401)
    expect((await POST(post('menu', { ids: 'all', record: 'x' }))).status).toBe(400)
    expect((await POST(post('menu', { ids: [] }))).status).toBe(400)
    expect(dbm.boardSave.updateMany).not.toHaveBeenCalled()
  })
})
