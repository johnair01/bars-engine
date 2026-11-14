import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The route reaches the board's store, which imports 'server-only'; every sibling suite stubs it the same way.
vi.mock('server-only', () => ({}))

import { createHash } from 'node:crypto'
import { setBackend, type ContentBackend } from '@/lib/board/content-store'
const docs = new Map<string, Record<string, unknown>>()
vi.mock('@/lib/board/store', async (orig) => ({
  ...(await orig<typeof import('@/lib/board/store')>()),
  latestDoc: async (_b: string, c: string, id: string) => docs.get(`${c}/${id}`) ?? null,
}))
vi.mock('@/lib/board/session-write', async (orig) => ({
  ...(await orig<typeof import('@/lib/board/session-write')>()),
  sessionWrite: async (_db: unknown, w: unknown[]) => ({ written: w.length }),
}))

import { POST } from '../route'

const KEY = 'test-council-key'
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')
const PICTURE = `data:image/png;base64,${PNG.toString('base64')}`

type Content = { type: string; text?: string; data?: string; mimeType?: string }
type Rpc = {
  result?: { content?: Content[]; isError?: boolean; tools?: { name: string }[] }
  error?: { code: number; message: string }
}

function memory(): ContentBackend & { files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>()
  return {
    name: 'memory',
    files,
    async read(key) {
      const b = files.get(key)
      return b ? { body: new Response(new Uint8Array(b)).body!, type: 'image/png' } : null
    },
    async write(key, bytes) { files.set(key, bytes) },
  }
}

let mem: ReturnType<typeof memory>

async function rpc(method: string, params: Record<string, unknown> = {}): Promise<Rpc> {
  const req = new NextRequest('http://localhost/api/mcp', {
    method: 'POST',
    headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  return (await (await POST(req)).json()) as Rpc
}

const call = (name: string, args: Record<string, unknown>) => rpc('tools/call', { name, arguments: args })
const payload = (r: Rpc) => JSON.parse(r.result?.content?.[0]?.text ?? '{}') as Record<string, unknown>

describe('the board MCP server', () => {
  beforeEach(() => {
    process.env.COUNCIL_MENU_TOKEN = KEY
    mem = memory()
    setBackend(mem)
  })

  it('answers the handshake and lists the tools', async () => {
    const init = await rpc('initialize', { protocolVersion: '2025-06-18' })
    expect(init.error).toBeUndefined()
    const list = await rpc('tools/list')
    const names = (list.result?.tools ?? []).map((t) => t.name)
    expect(names).toContain('post_rows')
    expect(names).toContain('put_picture')
    expect(names).toContain('read_picture')
    expect(names).toContain('list_pictures')
    expect(names).toContain('post_board_docs')
  })

  it('stores a picture, shows it back as image content, and lists it', async () => {
    const put = await call('put_picture', { data: PICTURE, round: '2026-11-12-probe', maker: 'freemilk' })
    expect(put.result?.isError).toBe(false)
    const stored = payload(put)
    expect(String(stored.url)).toContain('/board/stills/sha/')

    const seen = await call('read_picture', { sha: String(stored.sha) })
    expect(seen.result?.content?.[0]?.type).toBe('image')
    expect(seen.result?.content?.[0]?.mimeType).toBe('image/png')

    const listed = await call('list_pictures', { round: '2026-11-12-probe' })
    const pictures = payload(listed).pictures as { sha: string }[]
    expect(pictures.map((p) => p.sha)).toContain(stored.sha)
  })

  it('refuses a picture type it cannot serve', async () => {
    const put = await call('put_picture', { data: 'data:image/bmp;base64,AAAA' })
    expect(put.result?.isError).toBe(true)
    expect(put.result?.content?.[0]?.text).toContain('image/png')
  })

  it('refuses a design look without a sealed pass, and accepts it with one', async () => {
    docs.clear()
    const look = { kind: 'look', look: true, faces: ['shaman', 'regent'], pass: 'demo-pass' }
    const refused = await call('post_rows', { docs: [{ docId: 'look-1', data: look }] })
    expect(refused.result?.isError).toBe(true)
    expect(refused.result?.content?.[0]?.text).toContain('pass_check.py')

    const body = 'Ontology: profile game_design\n'
    docs.set('records/demo-pass', { kind: 'pass', body })
    docs.set('records/pass-check-demo-pass', { kind: 'ledger', body: JSON.stringify({
      pass: 'demo-pass', ok: true, sha256: createHash('sha256').update(body, 'utf8').digest('hex') }) })
    const accepted = await call('post_rows', { docs: [{ docId: 'look-1', data: look }] })
    expect(accepted.result?.isError).toBe(false)
  })

  it('refuses a call without the key', async () => {
    const req = new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    })
    expect((await POST(req)).status).toBe(401)
  })
})
