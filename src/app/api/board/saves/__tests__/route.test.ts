import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
const store = vi.hoisted(() => ({
  latestDocs: vi.fn(), lastPull: vi.fn(), latestDoc: vi.fn(), unrecordedSaves: vi.fn(), settledSeq: vi.fn(),
}))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/board/owner', () => owner)
vi.mock('@/lib/board/store', () => store)

import { GET } from '../route'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'

const req = (q = '') => ({ nextUrl: { searchParams: new URLSearchParams(q) } }) as never

describe('GET /api/board/saves', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    owner.isBoardOwner.mockResolvedValue(true)
    store.latestDocs.mockResolvedValue({})
    store.lastPull.mockResolvedValue(null)
    store.settledSeq.mockResolvedValue(4182)
  })

  it('names the change-log number the read covers, and null where the log is not numbered (live board)', async () => {
    store.unrecordedSaves.mockResolvedValue({ oldestReceivedAt: null, count: 0 })
    expect((await (await GET(req('board=council'))).json()).cursor).toBe(4182)
    store.settledSeq.mockRejectedValue(new Error('column "seq" does not exist'))
    expect((await (await GET(req('board=council'))).json()).cursor).toBeNull()
  })

  it('returns the oldest unrecorded save and how many wait', async () => {
    const at = new Date('2026-10-15T20:09:00Z')
    store.unrecordedSaves.mockResolvedValue({ oldestReceivedAt: at, count: 3 })
    const body = await (await GET(req())).json()
    expect(body.unrecorded).toEqual({ oldestReceivedAt: at.toISOString(), count: 3 })
    expect(store.unrecordedSaves).toHaveBeenCalledWith('nonprofit')
  })

  it('returns count 0 and no date when nothing waits', async () => {
    store.unrecordedSaves.mockResolvedValue({ oldestReceivedAt: null, count: 0 })
    const body = await (await GET(req('board=other'))).json()
    expect(body.unrecorded).toEqual({ oldestReceivedAt: null, count: 0 })
    expect(store.unrecordedSaves).toHaveBeenCalledWith('other')
  })

  it('leaves recorded rows out of the page read', async () => {
    store.unrecordedSaves.mockResolvedValue({ oldestReceivedAt: null, count: 0 })
    await GET(req('board=council'))
    expect(store.latestDocs).toHaveBeenCalledWith('council', { leaveOutRecordedRows: true })
  })

  it('names the page build main last pushed, so an older open page can reload (board-reverts)', async () => {
    store.unrecordedSaves.mockResolvedValue({ oldestReceivedAt: null, count: 0 })
    const m = memoryBackend({ 'board/council-board.html': '<p>page</p>' })
    setBackend(m.backend)
    const body = await (await GET(req('board=council'))).json()
    expect(body.page).toMatch(/^[0-9a-f]{64}$/)
    expect((await (await GET(req('board=other'))).json()).page).toBeNull()
    setBackend(undefined)
  })

  it('refuses a visitor who is not the owner', async () => {
    owner.isBoardOwner.mockResolvedValue(false)
    expect((await GET(req())).status).toBe(401)
  })
})
