import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
const store = vi.hoisted(() => ({ changesAfter: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/board/owner', () => owner)
vi.mock('@/lib/board/store', () => store)

import { GET } from '../route'

const req = (q = '', auth?: string) => ({
  nextUrl: { searchParams: new URLSearchParams(q) },
  headers: new Headers(auth ? { authorization: auth } : {}),
}) as never

describe('GET /api/board/changes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    owner.isBoardOwner.mockResolvedValue(true)
    store.changesAfter.mockResolvedValue({ changes: [{ seq: 7, collection: 'rows', docId: 'r1', data: { a: 1 } }], next: 7, more: false })
    delete process.env.COUNCIL_MENU_TOKEN
  })

  it('returns the saves after the number asked, and the number to ask from next', async () => {
    const body = await (await GET(req('board=council&after=6'))).json()
    expect(store.changesAfter).toHaveBeenCalledWith('council', 6)
    expect(body).toMatchObject({ next: 7, more: false, changes: [{ seq: 7, docId: 'r1' }] })
  })

  it('starts from 0 when no number is given', async () => {
    await GET(req('board=council'))
    expect(store.changesAfter).toHaveBeenCalledWith('council', 0)
  })

  it('refuses a number that is not a log number, and an unknown board', async () => {
    expect((await GET(req('board=council&after=-1'))).status).toBe(400)
    expect((await GET(req('board=council&after=abc'))).status).toBe(400)
    expect((await GET(req('board=elsewhere'))).status).toBe(400)
  })

  it('lets a session read with the council token, and refuses anyone else', async () => {
    owner.isBoardOwner.mockResolvedValue(false)
    expect((await GET(req('board=council'))).status).toBe(401)
    process.env.COUNCIL_MENU_TOKEN = 'sekrit'
    expect((await GET(req('board=council', 'Bearer sekrit'))).status).toBe(200)
  })
})
