import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const s = vi.hoisted(() => ({ listSpecs: vi.fn(), readSpec: vi.fn(), writeSpec: vi.fn(), linkPr: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/bar-to-work/specs', () => ({ ...s, validKey: (k: unknown) => typeof k === 'string' && /^[a-z0-9][a-z0-9._-]*$/i.test(k) }))

import { POST } from '../route'

const call = async (name: string, args: Record<string, unknown>) => {
  const req = new Request('http://x/api/mcp', {
    method: 'POST', headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  })
  const j = await (await POST(req as never)).json()
  return j.result as { isError: boolean; content: { text: string }[] }
}

describe('MCP spec tools', () => {
  beforeEach(() => { vi.resetAllMocks(); process.env.COUNCIL_MENU_TOKEN = 'secret' })

  it('tools/list names the four spec tools', async () => {
    const req = new Request('http://x/api/mcp', {
      method: 'POST', headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    })
    const names = (await (await POST(req as never)).json()).result.tools.map((t: { name: string }) => t.name)
    expect(names).toEqual(expect.arrayContaining(['list_specs', 'get_spec', 'post_spec', 'link_pr']))
  })
  it('list_specs hides drafts unless asked', async () => {
    s.listSpecs.mockResolvedValue([{ key: 'bar-1' }])
    await call('list_specs', {})
    expect(s.listSpecs).toHaveBeenCalledWith({ includeDraft: false })
    await call('list_specs', { drafts: true })
    expect(s.listSpecs).toHaveBeenLastCalledWith({ includeDraft: true })
  })
  it('get_spec returns the spec, an error for a missing or bad key', async () => {
    s.readSpec.mockResolvedValueOnce({ key: 'bar-1', markdown: '# s' })
    expect((await call('get_spec', { key: 'bar-1' })).isError).toBe(false)
    s.readSpec.mockResolvedValueOnce(null)
    expect((await call('get_spec', { key: 'bar-2' })).isError).toBe(true)
    expect((await call('get_spec', { key: '../x' })).isError).toBe(true)
  })
  it('post_spec and link_pr answer with the spec and the seed, or the refusal sentence', async () => {
    s.writeSpec.mockResolvedValueOnce({ ok: true, spec: { key: 'bar-1' }, seed: null })
    expect((await call('post_spec', { barId: '1', title: 't', markdown: 'm' })).isError).toBe(false)
    s.writeSpec.mockResolvedValueOnce({ ok: false, status: 400, error: 'A spec needs a title and its markdown.' })
    const r = await call('post_spec', {})
    expect(r.isError).toBe(true)
    expect(r.content[0].text).toMatch(/title/)
    s.linkPr.mockResolvedValueOnce({ ok: true, spec: { key: 'bar-1', prUrl: 'https://github.com/a/b/pull/1' }, seed: { status: 'pr_open' } })
    expect((await call('link_pr', { key: 'bar-1', prUrl: 'https://github.com/a/b/pull/1' })).isError).toBe(false)
    expect(s.linkPr).toHaveBeenCalledWith('bar-1', 'https://github.com/a/b/pull/1')
  })
})
