import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn(), boardOwnerId: vi.fn() }))
const store = vi.hoisted(() => ({ latestDoc: vi.fn() }))
const dbMock = vi.hoisted(() => ({ create: vi.fn() }))
const work = vi.hoisted(() => ({ ticketFromSave: vi.fn(), wakePickupAfter: vi.fn(), readyDraftsAfterSave: vi.fn() }))
vi.mock('@/lib/board/owner', () => owner)
vi.mock('@/lib/board/store', () => store)
vi.mock('@/lib/db', () => ({ db: { boardSave: { create: dbMock.create } } }))
vi.mock('@/lib/work/from-save', () => ({ ticketFromSave: work.ticketFromSave }))
vi.mock('@/lib/work/wake', () => ({ wakePickupAfter: work.wakePickupAfter }))
vi.mock('@/lib/board/ready-drafts', () => ({ readyDraftsAfterSave: work.readyDraftsAfterSave }))

import { POST } from '../route'

const pencil = (extra: Record<string, unknown> = {}) => ({
  board: 'council', collection: 'voice', docId: 'pencil--look-1--0',
  data: { kind: 'pencil', old: 'Pull the one that fits', new: 'Pick the one that fits', screen: 'tap-the-vein/ribbons',
    file: 'src/lib/tap-the-vein/paths.ts', look_row: 'look-1', savedAt: '2026-11-21T18:00:00Z', ...extra },
})
const request = (body: unknown, authorization?: string) => new NextRequest('https://example.test/api/board/saves', {
  method: 'POST', headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) }, body: JSON.stringify(body),
})

describe('POST /api/board/saves, voice collection', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'tok'
    owner.boardOwnerId.mockReturnValue('owner-id')
    dbMock.create.mockResolvedValue({ receivedAt: new Date('2026-11-21T18:00:01Z') })
    work.ticketFromSave.mockResolvedValue(null)
  })

  it("marks the owner's pencil save wendell and ignores a body's own mark", async () => {
    owner.isBoardOwner.mockResolvedValue(true)
    expect((await POST(request(pencil({ marked_by: 'someone' })))).status).toBe(200)
    expect(dbMock.create.mock.calls[0][0].data.data.marked_by).toBe('wendell')
  })

  it('refuses the menu token a voice save, so nothing but his cookie makes a pair', async () => {
    owner.isBoardOwner.mockResolvedValue(false)
    expect((await POST(request(pencil({ marked_by: 'wendell' }), 'Bearer tok'))).status).toBe(403)
    expect(dbMock.create).not.toHaveBeenCalled()
  })

  it('refuses a pencil with no old line', async () => {
    owner.isBoardOwner.mockResolvedValue(true)
    const bad = pencil(); delete (bad.data as Record<string, unknown>).old
    expect((await POST(request(bad))).status).toBe(422)
  })
})
