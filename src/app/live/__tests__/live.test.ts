import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))

import { setBackend, type ContentBackend } from '@/lib/board/content-store'
import { POST } from '@/app/api/mcp/route'
import { GET } from '../[...path]/route'
import { livePathError } from '@/lib/live/store'

const KEY = 'test-council-key'
let files: Map<string, Uint8Array>

function memory(): ContentBackend {
  return {
    name: 'memory',
    async read(key) { const b = files.get(key); return b ? { body: new Response(new Uint8Array(b)).body! } : null },
    async write(key, bytes) { files.set(key, bytes) },
  }
}

type Rpc = { result?: { content?: { text?: string }[]; isError?: boolean; tools?: { name: string }[] } }
async function call(name: string, args: Record<string, unknown>) {
  const req = new NextRequest('http://localhost/api/mcp', {
    method: 'POST',
    headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  })
  const r = (await (await POST(req)).json()) as Rpc
  return { isError: r.result?.isError, body: JSON.parse(r.result?.content?.[0]?.text ?? '{}') }
}
const get = (path: string, headers: Record<string, string> = {}) =>
  GET(new NextRequest(`http://localhost/live/${path}`, { headers }), { params: Promise.resolve({ path: path.split('/') }) })

describe('live game files', () => {
  beforeEach(() => {
    process.env.COUNCIL_MENU_TOKEN = KEY
    files = new Map()
    setBackend(memory())
  })

  it('publishes a file through the MCP and serves it sandboxed at /live', async () => {
    const put = await call('put_live_files', { files: [{ path: 'lantern-walk/index.html', text: '<h1>walk</h1>' }], by: 'test' })
    expect(put.isError).toBe(false)
    expect(put.body.published[0]).toMatchObject({ path: 'lantern-walk/index.html', previous: null, same: false })
    const res = await get('lantern-walk/index.html')
    expect(res.status).toBe(200)
    // Sandboxed storage throws, so each page gets a memory-backed shim first.
    expect(await res.text()).toMatch(/^<script>.*localStorage.*<\/script><h1>walk<\/h1>$/)
    expect(res.headers.get('content-type')).toContain('text/html')
    // The sandbox is the safety: no allow-same-origin, so the page cannot use a player's cookies.
    const csp = res.headers.get('content-security-policy') ?? ''
    expect(csp).toMatch(/^sandbox /)
    expect(csp).not.toContain('allow-same-origin')
  })

  it('redirects a bare game to its index and 404s what is not live', async () => {
    const res = await get('lantern-walk')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toMatch(/\/live\/lantern-walk\/index\.html$/)
    expect((await get('lantern-walk/missing.js')).status).toBe(404)
  })

  it('keeps earlier versions, so a bad publish reverts in one call', async () => {
    const first = await call('put_live_files', { files: [{ path: 'g/a.js', text: 'one' }] })
    const second = await call('put_live_files', { files: [{ path: 'g/a.js', text: 'two' }] })
    expect(second.body.published[0].previous).toBe(first.body.published[0].sha)
    const list = await call('list_live_files', { game: 'g' })
    expect(list.body.history['g/a.js'][0].sha).toBe(first.body.published[0].sha)
    const back = await call('revert_live_file', { path: 'g/a.js', sha: first.body.published[0].sha })
    expect(back.isError).toBe(false)
    expect((await call('read_live_file', { path: 'g/a.js' })).body.text).toBe('one')
  })

  it('stores binary files from base64 and answers them as base64', async () => {
    const png = Buffer.from('89504e470d0a1a0a', 'hex').toString('base64')
    await call('put_live_files', { files: [{ path: 'g/art/tile.png', base64: png }] })
    const read = await call('read_live_file', { path: 'g/art/tile.png' })
    expect(read.body.base64).toBe(png)
    expect((await get('g/art/tile.png')).headers.get('content-type')).toBe('image/png')
  })

  it('refuses paths outside a game folder and unknown file types', async () => {
    expect(livePathError('../etc/passwd')).toBeTruthy()
    expect(livePathError('index.html')).toBeTruthy()
    expect(livePathError('g/run.exe')).toBeTruthy()
    expect(livePathError('Game/a.js')).toBeTruthy()
    expect(livePathError('g/sub/a.js')).toBeNull()
    const put = await call('put_live_files', { files: [{ path: 'g/run.exe', text: 'x' }] })
    expect(put.isError).toBe(true)
    expect(put.body.refused[0]).toMatch(/extension/)
  })

  it('stops serving a removed file and brings it back by revert', async () => {
    const put = await call('put_live_files', { files: [{ path: 'g/a.js', text: 'one' }] })
    await call('remove_live_file', { path: 'g/a.js' })
    expect((await get('g/a.js')).status).toBe(404)
    await call('revert_live_file', { path: 'g/a.js', sha: put.body.published[0].sha })
    expect((await get('g/a.js')).status).toBe(200)
  })
})
