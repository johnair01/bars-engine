import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The route reaches the board's store, which imports 'server-only'; every sibling suite stubs it the same way.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))

import { POST, DELETE } from '../route'

const KEY = 'test-council-key'
const V = '2026-07-28'
type Rpc = { result?: Record<string, unknown>; error?: { code: number; message: string; data?: unknown } }

async function modern(method: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  const req = new NextRequest('http://localhost/api/mcp', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${KEY}`, 'content-type': 'application/json', 'mcp-protocol-version': V,
      'mcp-method': method, ...headers,
    },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 7, method,
      params: { ...params, _meta: { 'io.modelcontextprotocol/protocolVersion': V, 'io.modelcontextprotocol/clientCapabilities': {} } },
    }),
  })
  const res = await POST(req)
  return { status: res.status, body: (await res.json()) as Rpc }
}

describe('the board MCP server on 2026-07-28', () => {
  beforeEach(() => { process.env.COUNCIL_MENU_TOKEN = KEY })

  it('answers server/discover with the skills extension and no initialize', async () => {
    const { status, body } = await modern('server/discover')
    expect(status).toBe(200)
    expect(body.result?.resultType).toBe('complete')
    expect(body.result?.supportedVersions).toContain(V)
    expect(body.result?.capabilities).toMatchObject({ resources: {}, extensions: { 'io.modelcontextprotocol/skills': {} } })
    expect(body.result?.cacheScope).toBe('public')
  })

  it('lists tools with cache fields', async () => {
    const { body } = await modern('tools/list')
    expect((body.result?.tools as unknown[]).length).toBeGreaterThan(20)
    expect(body.result?.ttlMs).toBeGreaterThan(0)
  })

  it('refuses a header that disagrees with the body, and an unknown version', async () => {
    const bad = await modern('tools/list', {}, { 'mcp-protocol-version': '2025-06-18' })
    expect(bad.status).toBe(400)
    expect(bad.body.error?.code).toBe(-32020)
    const req = new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list',
        params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '1900-01-01' } } }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(((await res.json()) as Rpc).error?.code).toBe(-32022)
  })

  it('answers an unknown method with 404', async () => {
    const { status, body } = await modern('nope/nothing')
    expect(status).toBe(404)
    expect(body.error?.code).toBe(-32601)
  })

  it('publishes the six-faces skill and serves its SKILL.md', async () => {
    const list = await modern('skills/list')
    const skills = list.body.result?.skills as { uri: string; frontmatter: { name: string }; resources: { digest: string }[] }[]
    const six = skills.find((s) => s.frontmatter.name === 'six-faces')!
    expect(six.uri).toBe('skill://six-faces/SKILL.md')
    expect(six.resources[0].digest).toMatch(/^sha256:[0-9a-f]{64}$/)

    const got = await modern('skills/get', { uri: six.uri })
    expect((got.body.result?.skill as { uri: string }).uri).toBe(six.uri)

    const read = await modern('resources/read', { uri: six.uri }, { 'mcp-name': six.uri })
    const contents = read.body.result?.contents as { mimeType: string; text: string }[]
    expect(contents[0].mimeType).toBe('text/markdown')
    expect(contents[0].text).toMatch(/^---\nname: six-faces/)
  })

  it('refuses a skill path that leaves the folder or names an unserved skill', async () => {
    for (const uri of ['skill://six-faces/../../package.json', 'skill://spec-workflow/SKILL.md', 'file:///etc/passwd']) {
      const r = await modern('resources/read', { uri })
      expect(r.status).toBe(400)
      expect(r.body.error?.code).toBe(-32602)
    }
  })

  it('still opens an older client with initialize, and answers DELETE with 405', async () => {
    const req = new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }),
    })
    const init = (await (await POST(req)).json()) as Rpc
    expect(init.result?.protocolVersion).toBe('2025-06-18')
    expect(DELETE().status).toBe(405)
  })
})
