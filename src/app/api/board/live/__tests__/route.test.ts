import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ boardSave: { findMany: vi.fn() } }))
const store = vi.hoisted(() => ({ latestDocs: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: dbm }))
vi.mock('@/lib/board/store', () => store)

import { GET } from '../route'

const get = (authorization: string | null) => ({
  nextUrl: { searchParams: new URLSearchParams() },
  headers: new Headers(authorization ? { authorization } : {}),
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
})
