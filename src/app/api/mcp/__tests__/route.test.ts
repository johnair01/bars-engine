import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The route reaches the board's store, which imports 'server-only'; every sibling suite stubs it the same way.
vi.mock('server-only', () => ({}))

// The steer tools write the work queue; the suite gives them a one-ticket store.
const tix = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }))
vi.mock('@/lib/db', () => ({
  db: {
    workTicket: {
      findUnique: async ({ where }: { where: { id: string } }) => tix.rows.find((t) => t.id === where.id) ?? null,
      findMany: async () => tix.rows,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const t = tix.rows.find((x) => x.id === where.id)!
        Object.assign(t, data)
        return t
      },
    },
  },
}))

import { setBackend, type ContentBackend } from '@/lib/board/content-store'
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
    expect(names).toContain('steer_ticket')
    expect(names).toContain('list_tickets')
  })

  it('steer_ticket writes the store at once, and refuses a claimed ticket', async () => {
    tix.rows = [
      { id: 't1', title: 'x', state: 'ready', lane: 'claude', lanes: ['claude'], basis: {} },
      { id: 't2', title: 'y', state: 'claimed', lane: 'claude', lanes: ['claude'], basis: {} },
    ]
    const moved = await rpc('tools/call', { name: 'steer_ticket', arguments: { id: 't1', lane: 'freebuff' } })
    expect(moved.result?.isError).toBe(false)
    expect(tix.rows[0]).toMatchObject({ lane: 'freebuff', state: 'ready' })
    const refused = await rpc('tools/call', { name: 'steer_ticket', arguments: { id: 't2', lane: 'freebuff' } })
    expect(refused.result?.isError).toBe(true)
    expect(tix.rows[1].lane).toBe('claude')
    const listed = await rpc('tools/call', { name: 'list_tickets', arguments: {} })
    expect(listed.result?.content?.[0].text).toContain('t1')
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

  it('refuses a call without the key', async () => {
    const req = new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    })
    expect((await POST(req)).status).toBe(401)
  })
})
