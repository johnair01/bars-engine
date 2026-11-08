import { createHash } from 'crypto'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
vi.mock('@/lib/board/owner', () => owner)

import { GET } from '../route'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'

const packet = {
  version: 1, title: 'A spec', stage: 'analyze', createdAt: '2026-11-07T00:00:00Z',
  source: { repository: 'wendell-britt/Six-faces-council', commit: 'a'.repeat(40), branch: 'agent/codex/spec', path: '.specify/specs/portable-look-evidence' },
  documents: { request: '', spec: '# Spec', plan: '', tasks: '', reviews: '' },
  checks: [], limits: [], lookUrls: [],
}
const raw = JSON.stringify(packet), sha = createHash('sha256').update(raw).digest('hex')
const url = `https://bars-engine.vercel.app/api/board/spec/${sha}`

beforeEach(() => {
  owner.isBoardOwner.mockResolvedValue(false)
  vi.stubEnv('COUNCIL_MENU_TOKEN', 'secret')
  const mem = memoryBackend()
  mem.objects.set('sha/' + sha, { bytes: new TextEncoder().encode(raw), type: 'application/json' })
  setBackend(mem.backend)
})
afterEach(() => { setBackend(undefined); vi.unstubAllEnvs(); vi.resetAllMocks() })

describe('GET /api/board/spec/[sha]', () => {
  it('keeps the private packet closed without owner access or bearer token', async () => {
    const res = await GET(new NextRequest(url), { params: Promise.resolve({ sha }) })
    expect(res.status).toBe(401)
  })

  it('allows an authorized session and refuses an unknown hash', async () => {
    const req = new NextRequest(url, { headers: { authorization: 'Bearer secret' } })
    const res = await GET(req, { params: Promise.resolve({ sha }) })
    expect(res.status).toBe(200)
    expect((await res.json()).source.commit).toBe(packet.source.commit)
    const missing = await GET(req, { params: Promise.resolve({ sha: 'b'.repeat(64) }) })
    expect(missing.status).toBe(404)
  })

  it('allows the signed-in board owner without exposing a token', async () => {
    owner.isBoardOwner.mockResolvedValue(true)
    const res = await GET(new NextRequest(url), { params: Promise.resolve({ sha }) })
    expect(res.status).toBe(200)
  })
})
