import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const s = vi.hoisted(() => ({ listSpecs: vi.fn(), readSpec: vi.fn(), writeSpec: vi.fn(), linkPr: vi.fn() }))
vi.mock('@/lib/bar-to-work/specs', () => ({ ...s, validKey: (k: unknown) => typeof k === 'string' && /^[a-z0-9][a-z0-9._-]*$/i.test(k) }))

import { GET, POST } from '../route'
import { GET as GET_ONE, POST as LINK } from '../[key]/route'

const req = (token: string | null, q = '', body?: unknown) => ({
  nextUrl: { searchParams: new URLSearchParams(q) },
  headers: new Headers(token ? { authorization: `Bearer ${token}` } : {}),
  json: async () => body,
}) as never

describe('/api/specs', () => {
  beforeEach(() => { vi.resetAllMocks(); process.env.COUNCIL_MENU_TOKEN = 'secret' })

  it('401 without a token on every route', async () => {
    expect((await GET(req(null))).status).toBe(401)
    expect((await POST(req(null, '', {}))).status).toBe(401)
    expect((await GET_ONE(req(null), { params: Promise.resolve({ key: 'k' }) })).status).toBe(401)
    expect((await LINK(req(null, '', {}), { params: Promise.resolve({ key: 'k' }) })).status).toBe(401)
  })
  it('the council token lists drafts only with ?drafts=1', async () => {
    s.listSpecs.mockResolvedValue([])
    await GET(req('secret'))
    expect(s.listSpecs).toHaveBeenLastCalledWith({ includeDraft: false })
    await GET(req('secret', 'drafts=1'))
    expect(s.listSpecs).toHaveBeenLastCalledWith({ includeDraft: true })
  })
  it('POST writes a spec (201) and passes a refusal through', async () => {
    s.writeSpec.mockResolvedValueOnce({ ok: true, spec: { key: 'bar-1' }, seed: null })
    expect((await POST(req('secret', '', { barId: '1', title: 't', markdown: 'm' }))).status).toBe(201)
    s.writeSpec.mockResolvedValueOnce({ ok: false, status: 400, error: 'no' })
    expect((await POST(req('secret', '', {}))).status).toBe(400)
  })
  it('GET one: 400 bad key, 404 draft or unknown, 200 merged', async () => {
    const ctx = (key: string) => ({ params: Promise.resolve({ key }) })
    expect((await GET_ONE(req('secret'), ctx('../x'))).status).toBe(400)
    s.readSpec.mockResolvedValueOnce(null)
    expect((await GET_ONE(req('secret'), ctx('bar-1'))).status).toBe(404)
    s.readSpec.mockResolvedValueOnce({ key: 'bar-1' })
    expect((await GET_ONE(req('secret'), ctx('bar-1'))).status).toBe(200)
  })
  it('link: records the PR on the spec', async () => {
    s.linkPr.mockResolvedValue({ ok: true, spec: { key: 'bar-1' }, seed: { status: 'pr_open' } })
    const res = await LINK(req('secret', '', { prUrl: 'https://github.com/a/b/pull/1' }), { params: Promise.resolve({ key: 'bar-1' }) })
    expect(res.status).toBe(200)
    expect(s.linkPr).toHaveBeenCalledWith('bar-1', 'https://github.com/a/b/pull/1')
  })
})
