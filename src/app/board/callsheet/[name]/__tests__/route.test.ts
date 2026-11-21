import { createHash } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
vi.mock('@/lib/board/owner', () => owner)

import { NextRequest } from 'next/server'
import { setBackend, setEntries, storeObject } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'
import { GET } from '../route'

const TEXT = '# Receipt seal\n\n<script>alert(1)</script> & "quoted"\n'
const SHA = createHash('sha256').update(TEXT).digest('hex')

function get(name: string, token?: string) {
  const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
  return GET(new NextRequest('https://bars-engine.vercel.app/board/callsheet/' + name, { headers }), { params: Promise.resolve({ name }) })
}

beforeEach(async () => {
  vi.stubEnv('COUNCIL_MENU_TOKEN', 't0ken')
  owner.isBoardOwner.mockResolvedValue(false)
  setBackend(memoryBackend().backend)
  await storeObject(SHA, new TextEncoder().encode(TEXT), 'text/markdown; charset=utf-8')
  await setEntries({ 'council/callsheets/receipt-seal.md': { sha: SHA, type: 'text/markdown; charset=utf-8', size: TEXT.length } })
})
afterEach(() => { setBackend(undefined); vi.unstubAllEnvs() })

describe('GET /board/callsheet/[name]', () => {
  it('sends a stranger to sign in', async () => {
    const r = await get('receipt-seal.md')
    expect(r.status).toBe(307)
    expect(r.headers.get('location')).toContain('/login')
  })

  it('shows the owner the whole callsheet as escaped text', async () => {
    owner.isBoardOwner.mockResolvedValue(true)
    const r = await get('receipt-seal.md')
    const html = await r.text()
    expect(r.status).toBe(200)
    expect(html).toContain('# Receipt seal')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quoted&quot;')
    expect(html).not.toContain('<script>')
    expect(r.headers.get('content-security-policy')).toContain("default-src 'none'")
  })

  it('opens for a council session with the token', async () => {
    expect((await get('receipt-seal.md', 't0ken')).status).toBe(200)
  })

  it('answers 404 for a path outside council/callsheets/*.md', async () => {
    owner.isBoardOwner.mockResolvedValue(true)
    for (const n of ['..%2Ffaces.yaml', '../faces.yaml', 'stills%2Fa.png', 'faces.yaml', 'a.md%2F..%2Fb.md', '.md%00'])
      expect((await get(n)).status, n).toBe(404)
  })

  it('answers 404 for a callsheet that was never pushed', async () => {
    owner.isBoardOwner.mockResolvedValue(true)
    expect((await get('nothing-here.md')).status).toBe(404)
  })
})
