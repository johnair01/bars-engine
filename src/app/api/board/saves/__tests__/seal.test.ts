import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn(), boardOwnerId: vi.fn() }))
const store = vi.hoisted(() => ({ latestDocs: vi.fn(), lastPull: vi.fn(), latestDoc: vi.fn(), unrecordedSaves: vi.fn() }))
const seal = vi.hoisted(() => ({ writeBoardSeal: vi.fn() }))
const aside = vi.hoisted(() => ({ setAsideFromBoard: vi.fn() }))
const db = vi.hoisted(() => {
  const create = vi.fn().mockResolvedValue({ receivedAt: new Date('2026-10-16T18:00:00Z') })
  const d = { boardSave: { create }, $transaction: vi.fn() }
  d.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(d))
  return d
})
vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/board/owner', () => owner)
vi.mock('@/lib/board/store', () => store)
vi.mock('@/lib/board/dispatch', () => ({ dispatchBoardPull: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/tap-the-vein/board-seal', () => seal)
vi.mock('@/lib/tap-the-vein/board-set-aside', () => aside)

import { POST } from '../route'

const menuSave = (board: string) => ({
  board, collection: 'morning', docId: 'menu', mode: 'set',
  data: { menu: '{"sessionDate":"2026-10-16","items":[]}', sessionDate: '2026-10-16', savedAt: '2026-10-16T18:00:00.000Z' },
})
const post = (body: unknown) => ({ headers: new Headers(), nextUrl: new URL('https://bars-engine.vercel.app/api/board/saves'),
  text: async () => JSON.stringify(body) }) as never

describe('POST /api/board/saves, the council seal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    owner.isBoardOwner.mockResolvedValue(true)
    owner.boardOwnerId.mockReturnValue('p1')
    seal.writeBoardSeal.mockResolvedValue('{"items":[{"taskId":"t1"}]}')
  })

  it('writes the council menu as tasks and saves the menu carrying their ids', async () => {
    const res = await POST(post(menuSave('council')))
    expect(res.status).toBe(200)
    expect(seal.writeBoardSeal).toHaveBeenCalledWith(db, 'p1', '{"sessionDate":"2026-10-16","items":[]}')
    expect(db.boardSave.create.mock.calls[0][0].data.data.menu).toBe('{"items":[{"taskId":"t1"}]}')
    expect((await res.json()).doc.menu).toBe('{"items":[{"taskId":"t1"}]}')
  })

  it('leaves the Nonprofit Board\'s saves alone', async () => {
    await POST(post(menuSave('nonprofit')))
    expect(seal.writeBoardSeal).not.toHaveBeenCalled()
    expect(db.boardSave.create).toHaveBeenCalledTimes(1)
  })

  const seedSave = { board: 'council', collection: 'seeds', docId: 't1', mode: 'set',
    data: { taskId: 't1', text: 'Respond to Madi', savedAt: '2026-10-16T19:00:00.000Z' } }

  it('sets a council seed aside and saves it born recorded', async () => {
    aside.setAsideFromBoard.mockResolvedValue({ ok: true, already: false })
    const res = await POST(post(seedSave))
    expect(res.status).toBe(200)
    expect(aside.setAsideFromBoard).toHaveBeenCalledWith(db, 'p1', 't1')
    const data = db.boardSave.create.mock.calls[0][0].data
    expect(data.recordedAt).toBeInstanceOf(Date)
    expect(data.record).toBe('set aside in bars-engine')
  })

  it('saves nothing when the task cannot rest', async () => {
    aside.setAsideFromBoard.mockResolvedValue({ ok: false, status: 409, error: 'It is completed, so it cannot rest' })
    const res = await POST(post(seedSave))
    expect(res.status).toBe(409)
    expect(db.boardSave.create).not.toHaveBeenCalled()
  })
})
