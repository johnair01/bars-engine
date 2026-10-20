import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ boardSave: { findFirst: vi.fn(), create: vi.fn() } }))
const store = vi.hoisted(() => ({ latestDocs: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: dbm }))
vi.mock('@/lib/board/store', () => store)

import { GET, POST } from '../route'

const req = (body: unknown, token: string | null = 'secret', q = 'board=council') => ({
  nextUrl: { searchParams: new URLSearchParams(q) },
  headers: new Headers(token ? { 'x-board-import-token': token } : {}),
  json: async () => body,
}) as never
const list = { collection: 'lists', docId: 'a', data: { title: 'A list' } }
const contact = { collection: 'contacts', docId: 'ari', data: { name: 'Ari' } }

describe('/api/board/import', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.BOARD_IMPORT_TOKEN = 'secret'
    dbm.boardSave.findFirst.mockResolvedValue(null)
    dbm.boardSave.create.mockResolvedValue({})
  })

  it('is off while BOARD_IMPORT_TOKEN is unset, and refuses a wrong token', async () => {
    delete process.env.BOARD_IMPORT_TOKEN
    expect((await POST(req({ board: 'council', docs: [] }))).status).toBe(503)
    process.env.BOARD_IMPORT_TOKEN = 'secret'
    expect((await POST(req({ board: 'council', docs: [] }, 'wrong'))).status).toBe(401)
    expect((await GET(req(null, null))).status).toBe(401)
    expect(dbm.boardSave.create).not.toHaveBeenCalled()
  })

  it('appends new documents as artifact imports and skips ones already here', async () => {
    dbm.boardSave.findFirst.mockImplementation(async ({ where }: { where: { docId: string } }) =>
      where.docId === 'ari' ? { data: { name: 'Ari' } } : null)
    const body = await (await POST(req({ board: 'council', docs: [list, contact] }))).json()
    expect(body.added).toEqual(['lists/a'])
    expect(body.same).toBe(1)
    expect(dbm.boardSave.create).toHaveBeenCalledTimes(1)
    const row = dbm.boardSave.create.mock.calls[0][0].data
    expect(row).toMatchObject({ board: 'council', collection: 'lists', docId: 'a', source: 'artifact-import' })
    expect(row.recordedAt).toBeInstanceOf(Date)  // lists are board state, born recorded
  })

  it('writes nothing on a dry run', async () => {
    const body = await (await POST(req({ board: 'council', docs: [list], dry: true }))).json()
    expect(body.added).toEqual(['lists/a'])
    expect(dbm.boardSave.create).not.toHaveBeenCalled()
  })

  it('counts what the store holds', async () => {
    store.latestDocs.mockResolvedValue({ lists: { a: {}, b: {} }, contacts: {} })
    const body = await (await GET(req(null))).json()
    expect(body.counts).toEqual({ lists: 2, contacts: 0 })
  })
})
