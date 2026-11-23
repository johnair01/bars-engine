import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
const dbm = vi.hoisted(() => ({ db: { boardSave: { findMany: vi.fn() } } }))
vi.mock('@/lib/db', () => dbm)
vi.mock('@/lib/board/owner', () => owner)

import { GET } from '../route'

const req = (q = '', auth?: string) => ({
  nextUrl: { searchParams: new URLSearchParams(q) },
  headers: new Headers(auth ? { authorization: auth } : {}),
}) as never

describe('GET /api/board/voice', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    owner.isBoardOwner.mockResolvedValue(false)
    process.env.COUNCIL_MENU_TOKEN = 'sekrit'
    dbm.db.boardSave.findMany.mockResolvedValue([
      { seq: BigInt(11), docId: 'pencil-1', data: { kind: 'pencil', marked_by: 'wendell' }, receivedAt: new Date('2026-11-21T15:00:00Z') },
      { seq: BigInt(14), docId: 'pencil-2', data: { kind: 'pencil', marked_by: 'wendell' }, receivedAt: new Date('2026-11-21T15:05:00Z') },
    ])
  })

  it('serves the voice events after the number asked, in seq order, and the number to ask from next', async () => {
    const res = await GET(req('after=10', 'Bearer sekrit'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(dbm.db.boardSave.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { board: 'council', collection: 'voice', seq: { gt: BigInt(10) } }, orderBy: { seq: 'asc' } }))
    expect(body.last).toBe(14)
    expect(body.events.map((e: { seq: number }) => e.seq)).toEqual([11, 14])
    expect(body.events[0]).toMatchObject({ docId: 'pencil-1', data: { kind: 'pencil' }, receivedAt: '2026-11-21T15:00:00.000Z' })
  })

  it('starts from 0 and keeps `last` where it was when nothing is new', async () => {
    dbm.db.boardSave.findMany.mockResolvedValue([])
    const body = await (await GET(req('', 'Bearer sekrit'))).json()
    expect(body).toEqual({ events: [], last: 0 })
  })

  it('refuses anyone without the token or the owner cookie, and a bad number', async () => {
    expect((await GET(req('after=0'))).status).toBe(401)
    expect((await GET(req('after=0', 'Bearer wrong'))).status).toBe(401)
    expect(dbm.db.boardSave.findMany).not.toHaveBeenCalled()
    expect((await GET(req('after=-1', 'Bearer sekrit'))).status).toBe(400)
    expect((await GET(req('after=abc', 'Bearer sekrit'))).status).toBe(400)
  })

  it('lets the board owner read with the cookie', async () => {
    owner.isBoardOwner.mockResolvedValue(true)
    expect((await GET(req('after=0'))).status).toBe(200)
  })
})
