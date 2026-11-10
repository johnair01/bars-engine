import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

const TOKEN = 'test-council-menu-token'
const answer = {
  board: 'council',
  collection: 'questions',
  docId: 'dl-backtest-gap',
  data: { choice: 'rerun', savedAt: '2026-11-10T19:00:00.000Z' },
}

function request(body: unknown, authorization?: string) {
  return new NextRequest('https://example.test/api/board/saves', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
    body: JSON.stringify(body),
  })
}

describe('POST /api/board/saves with Council menu token', () => {
  const previousToken = process.env.COUNCIL_MENU_TOKEN

  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = TOKEN
    owner.isBoardOwner.mockResolvedValue(false)
    owner.boardOwnerId.mockReturnValue('owner-id')
    store.latestDoc.mockImplementation(async (_board: string, collection: string) =>
      collection === 'rows'
        ? { kind: 'questions', options: [{ v: 'rerun', label: 'Rerun the gate' }, { v: 'wait', label: 'Wait' }] }
        : null)
    dbMock.create.mockResolvedValue({ receivedAt: new Date('2026-11-10T19:00:01.000Z') })
    work.ticketFromSave.mockResolvedValue({ created: true, lane: 'claude', state: 'ready' })
  })

  afterEach(() => {
    if (previousToken === undefined) delete process.env.COUNCIL_MENU_TOKEN
    else process.env.COUNCIL_MENU_TOKEN = previousToken
  })

  it('saves a listed option through the normal ticket path', async () => {
    const response = await POST(request(answer, `Bearer ${TOKEN}`))
    expect(response.status).toBe(200)
    expect(dbMock.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ board: 'council', collection: 'questions', docId: answer.docId, data: answer.data }),
    }))
    expect(work.ticketFromSave).toHaveBeenCalledWith(expect.anything(), 'council', 'questions', answer.docId, answer.data)
    expect(work.wakePickupAfter).toHaveBeenCalled()
  })

  it('rejects a missing or wrong token', async () => {
    expect((await POST(request(answer))).status).toBe(401)
    expect((await POST(request(answer, 'Bearer wrong-token'))).status).toBe(401)
    expect(dbMock.create).not.toHaveBeenCalled()
  })

  it('rejects nonexistent cards and unlisted options', async () => {
    store.latestDoc.mockResolvedValue(null)
    expect((await POST(request(answer, `Bearer ${TOKEN}`))).status).toBe(422)
    store.latestDoc.mockImplementation(async (_board: string, collection: string) =>
      collection === 'rows' ? { kind: 'questions', options: [{ v: 'wait', label: 'Wait' }] } : null)
    expect((await POST(request(answer, `Bearer ${TOKEN}`))).status).toBe(422)
    expect(dbMock.create).not.toHaveBeenCalled()
  })

  it('does not replace an existing answer', async () => {
    store.latestDoc.mockImplementation(async (_board: string, collection: string) =>
      collection === 'rows' ? { kind: 'questions', options: [{ v: 'rerun', label: 'Rerun' }] } : { choice: 'wait' })
    expect((await POST(request(answer, `Bearer ${TOKEN}`))).status).toBe(409)
    expect(dbMock.create).not.toHaveBeenCalled()
  })

  it('rejects edits to other collections or board state', async () => {
    const attempts = [
      { ...answer, board: 'nonprofit' },
      { ...answer, collection: 'positions' },
      { ...answer, collection: 'questions', mode: 'update' },
      { ...answer, data: { ...answer.data, steer: 'extra field' } },
    ]
    for (const attempt of attempts) expect((await POST(request(attempt, `Bearer ${TOKEN}`))).status).toBe(403)
    expect(dbMock.create).not.toHaveBeenCalled()
  })

  it('keeps the signed-in owner save path', async () => {
    owner.isBoardOwner.mockResolvedValue(true)
    const response = await POST(request({ ...answer, collection: 'positions', data: { status: 'stands', savedAt: answer.data.savedAt } }))
    expect(response.status).toBe(200)
    expect(dbMock.create).toHaveBeenCalled()
  })
})
