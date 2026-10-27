import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const dbm = vi.hoisted(() => ({ boardSave: { findFirst: vi.fn(), create: vi.fn() } }))
const store = vi.hoisted(() => ({ latestDocs: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: dbm }))
vi.mock('@/lib/board/store', () => store)

import { GET, POST } from '../route'
import { canonical, docHash } from '@/lib/board/session-write'

const req = (body: unknown, token: string | null = 'secret', q = '') => ({
  nextUrl: { searchParams: new URLSearchParams(q) },
  headers: new Headers(token ? { authorization: `Bearer ${token}` } : {}),
  json: async () => body,
}) as never
const step = { collection: 'steps', docId: 'feat-01', data: { do: 'Open the page', due: '2026-10-22' } }

describe('/api/board/session-writes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.COUNCIL_MENU_TOKEN = 'secret'
    dbm.boardSave.findFirst.mockResolvedValue(null)
    dbm.boardSave.create.mockResolvedValue({})
  })

  it('needs COUNCIL_MENU_TOKEN', async () => {
    expect((await POST(req({ docs: [step] }, 'wrong'))).status).toBe(401)
    expect((await GET(req(null, null))).status).toBe(401)
    delete process.env.COUNCIL_MENU_TOKEN
    expect((await POST(req({ docs: [step] }))).status).toBe(503)
    expect(dbm.boardSave.create).not.toHaveBeenCalled()
  })

  it('merges an update onto the latest step, keeping his tick and note', async () => {
    dbm.boardSave.findFirst.mockResolvedValue({ data: { do: 'Old text', done: true, note: 'did it' } })
    const body = await (await POST(req({ docs: [step] }))).json()
    expect(body.written).toEqual(['steps/feat-01'])
    const row = dbm.boardSave.create.mock.calls[0][0].data
    expect(row).toMatchObject({ board: 'council', source: 'session' })
    expect(row.data).toEqual({ do: 'Open the page', due: '2026-10-22', done: true, note: 'did it' })
    expect(row.recordedAt).toBeInstanceOf(Date)  // a session write is never an answer waiting for the pull
  })

  it('skips a write that changes nothing, whatever the key order', async () => {
    dbm.boardSave.findFirst.mockResolvedValue({ data: { due: '2026-10-22', do: 'Open the page' } })
    const body = await (await POST(req({ docs: [step] }))).json()
    expect(body).toMatchObject({ written: [], same: 1 })
    expect(dbm.boardSave.create).not.toHaveBeenCalled()
  })

  it('refuses his answer collections and writes nothing on a dry run', async () => {
    const q = { collection: 'questions', docId: 'x', data: { choice: 'A', savedAt: '2026-10-20T00:00:00Z' } }
    const body = await (await POST(req({ docs: [q, step], dry: true }))).json()
    expect(body.refused).toHaveLength(1)
    expect(body.written).toEqual(['steps/feat-01'])
    expect(dbm.boardSave.create).not.toHaveBeenCalled()
  })

  it('answers hashes, not contents', async () => {
    store.latestDocs.mockResolvedValue({ contacts: { ari: { name: 'Ari', notes: 'private' } } })
    const body = await (await GET(req(null, 'secret', 'collection=contacts'))).json()
    expect(body.hashes).toEqual({ contacts: { ari: docHash({ notes: 'private', name: 'Ari' }) } })
    expect(JSON.stringify(body)).not.toContain('private')
  })

  it('answers contents only for the ids asked', async () => {
    store.latestDocs.mockResolvedValue({ contacts: { ari: { name: 'Ari' }, bo: { name: 'Bo' } }, steps: {} })
    const body = await (await GET(req(null, 'secret', 'ids=contacts/ari,steps/none,other/x'))).json()
    expect(body.docs).toEqual({ 'contacts/ari': { name: 'Ari' } })
  })

  it('hashes the same canonical form as board/store_write.py', () => {
    // python3 -c 'import json;print(json.dumps({"b":[1,{"d":"é","c":None}],"a":True},sort_keys=True,separators=(",",":"),ensure_ascii=False))'
    expect(canonical({ b: [1, { d: 'é', c: null }], a: true })).toBe('{"a":true,"b":[1,{"c":null,"d":"é"}]}')
  })
})
