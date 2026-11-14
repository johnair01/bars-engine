import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ $queryRaw: vi.fn(), workTicket: { findMany: vi.fn() } }))
const store = vi.hoisted(() => ({ latestDoc: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: dbm }))
vi.mock('@/lib/board/store', () => store)
vi.mock('@/lib/board/session-write', () => ({ sessionWrite: vi.fn() }))
vi.mock('@/lib/board/picture-store', () => ({
  listPictures: vi.fn(), liftInlinePictures: vi.fn(), readPictureBytes: vi.fn(), shaFromUrl: vi.fn(), storePicture: vi.fn(),
}))

import { POST } from '../route'

const call = (name: string, args: Record<string, unknown>, auth: string | null = 'Bearer menu') => POST({
  nextUrl: { searchParams: new URLSearchParams() },
  headers: new Headers(auth ? { authorization: auth } : {}),
  json: async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
} as never)
const payload = async (res: Response) => {
  const body = await res.json()
  return { isError: body.result.isError, data: JSON.parse(body.result.content[0].text) }
}

const row = { kind: 'questions', q: 'Ship it?', options: [{ v: 'A', label: 'A. Yes (recommended)' }, { v: 'B', label: 'B. No' }] }

describe('board MCP read_answers and list_open', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'menu'
  })

  it('lists both tools and refuses a wrong token', async () => {
    expect((await call('whoami', {}, null)).status).toBe(401)
    const { data } = await payload(await call('whoami', {}))
    expect(data.tools).toEqual(expect.arrayContaining(['read_answers', 'list_open']))
  })

  it('read_answers gives his choice, label, steer and time, and names open and unknown ids', async () => {
    store.latestDoc.mockImplementation(async (_b: string, collection: string, id: string) => {
      if (collection === 'questions' && id === 'q-done') return { choice: 'A', steer: ' go ', savedAt: '2026-11-13T20:00:00Z' }
      if (collection === 'rows' && (id === 'q-done' || id === 'q-open')) return row
      if (collection === 'resolved' && id === 'questions--q-old') return { decision: 'B', label: 'No', saved_at: '2026-10-01T00:00:00Z' }
      return null
    })
    const { data } = await payload(await call('read_answers', { ids: ['q-done', 'q-open', 'q-old', 'q-none'] }))
    const by = Object.fromEntries(data.answers.map((a: { id: string }) => [a.id, a]))
    expect(by['q-done']).toEqual({ id: 'q-done', state: 'answered', choice: 'A', label: 'Yes', steer: 'go', savedAt: '2026-11-13T20:00:00Z' })
    expect(by['q-open']).toEqual({ id: 'q-open', state: 'open' })
    expect(by['q-old']).toMatchObject({ state: 'answered', choice: 'B', savedAt: '2026-10-01T00:00:00Z' })
    expect(by['q-none']).toEqual({ id: 'q-none', state: 'unknown id' })
  })

  it('read_answers needs ids', async () => {
    const body = await (await call('read_answers', {})).json()
    expect(body.result.isError).toBe(true)
  })

  it('list_open lists unanswered questions, open battle turns and ready tickets per lane with brief and owner', async () => {
    const h = (o: Record<string, unknown>) => ({ kind: null, q: null, name: null, choice: null, choices: null, steer: null,
      deferred: null, rounds: null, saved_at: null, received_at: new Date('2026-11-13T10:00:00Z'), ...o })
    dbm.$queryRaw.mockResolvedValue([
      h({ collection: 'rows', doc_id: 'q-done', kind: 'questions', q: 'a' }),
      h({ collection: 'questions', doc_id: 'q-done', choice: 'A' }),
      h({ collection: 'rows', doc_id: 'q-open', kind: 'questions', q: 'Which look?' }),
      h({ collection: 'rows', doc_id: 'b1', kind: 'battles', name: 'Scene', rounds: [
        { n: 1, questions: ['q-done'] }, { n: 2, questions: ['q-open', 'q-done'] }] }),
    ])
    dbm.workTicket.findMany.mockResolvedValue([
      { sourceKey: 'k1', title: 'T1', brief: 'x'.repeat(700), lane: 'claude', lanes: ['claude', 'freebuff'], createdAt: new Date('2026-11-13T09:00:00Z') },
      { sourceKey: 'k2', title: 'T2', brief: 'short', lane: 'freebuff', lanes: ['freebuff'], createdAt: new Date('2026-11-13T09:30:00Z') },
    ])
    const { data } = await payload(await call('list_open', {}))
    expect(data.questions.map((q: { id: string }) => q.id)).toEqual(['q-open'])
    expect(data.battleTurns).toEqual([{ battle: 'b1', name: 'Scene', round: 2, open: ['q-open'] }])
    expect(data.readyTickets.claude.tickets[0]).toMatchObject({ owner: 'claude', title: 'T1' })
    expect(data.readyTickets.claude.tickets[0].brief.length).toBeLessThan(700)
    expect(data.readyTickets.freebuff.count).toBe(1)
    expect(dbm.workTicket.findMany.mock.calls[0][0].where).toEqual({ state: 'ready' })
  })
})
