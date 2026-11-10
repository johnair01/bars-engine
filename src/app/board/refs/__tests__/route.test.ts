import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
vi.mock('@/lib/board/owner', () => owner)

import { NextRequest } from 'next/server'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'
import { GET } from '../route'

const REF = 'council/callsheets/stills/2026-11-06-cultivated-character-gate/refs/00-07-20.jpg'
const BYTES = 'the walk reference, as a push left it'
const BASE = 'https://bars-engine.vercel.app/board/refs/'

function get(p: string, token?: string) {
  const headers = token ? { authorization: `Bearer ${token}` } : {}
  return GET(new NextRequest(BASE + p, { headers }), { params: Promise.resolve({ path: p.split('/') }) })
}

beforeEach(() => {
  vi.stubEnv('COUNCIL_MENU_TOKEN', 't0ken')
  owner.isBoardOwner.mockResolvedValue(false)
  setBackend(memoryBackend({ [REF]: BYTES }).backend)
})
afterEach(() => { setBackend(undefined); vi.unstubAllEnvs() })

describe('GET /board/refs', () => {
  it('refuses a stranger: a reference is not published the way a look picture is', async () => {
    expect((await get(`2026-11-06-cultivated-character-gate/refs/00-07-20.jpg`)).status).toBe(401)
  })

  it('serves a reference to a council session, kept in that browser and no shared cache', async () => {
    const r = await get('2026-11-06-cultivated-character-gate/refs/00-07-20.jpg', 't0ken')

    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('image/jpeg')
    expect(r.headers.get('cache-control')).toContain('private')
    expect(r.headers.get('cache-control')).toContain('immutable')
    expect(await r.text()).toBe(BYTES)
  })

  it('serves it to the board owner on his own page', async () => {
    owner.isBoardOwner.mockResolvedValue(true)

    expect((await get('2026-11-06-cultivated-character-gate/refs/00-07-20.jpg')).status).toBe(200)
  })

  it('refuses anything that is not a look refs folder, and any path that climbs out of one', async () => {
    expect((await get('board/council-board.html', 't0ken')).status).toBe(404)
    expect((await get('2026-11-06-cultivated-character-gate/refs/../../board/council-board.html', 't0ken')).status).toBe(404)
  })

  it('says so when the reference was never pushed', async () => {
    expect((await get('2026-11-06-cultivated-character-gate/refs/00-09-99.jpg', 't0ken')).status).toBe(404)
  })
})
