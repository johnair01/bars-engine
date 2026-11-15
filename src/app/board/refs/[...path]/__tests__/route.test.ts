import { createHash } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
vi.mock('@/lib/board/owner', () => owner)

import { NextRequest } from 'next/server'
import { readObject, readRefObject, setBackend, setEntries, storeObject, storeRefObject } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'
import { artPath } from '../../../art'
import { GET } from '../route'

const REF = 'council/callsheets/stills/cc-cultivation-clothing/refs/Ma1zP7EZMps/sheet.jpg'
const BYTES = 'the walk reference, as a push left it'
const SHA = createHash('sha256').update(BYTES).digest('hex')
const BASE = 'https://bars-engine.vercel.app/board/refs/'
const REL = 'council/callsheets/stills/cc-cultivation-clothing/refs/Ma1zP7EZMps/sheet.jpg'

function get(p: string, token?: string) {
  const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
  return GET(new NextRequest(BASE + p, { headers }), { params: Promise.resolve({ path: p.split('/') }) })
}

beforeEach(async () => {
  vi.stubEnv('COUNCIL_MENU_TOKEN', 't0ken')
  owner.isBoardOwner.mockResolvedValue(false)
  setBackend(memoryBackend().backend)
  await storeRefObject(SHA, new TextEncoder().encode(BYTES), 'image/jpeg')
  await setEntries({ [REF]: { sha: SHA, type: 'image/jpeg', size: BYTES.length } })
})
afterEach(() => { setBackend(undefined); vi.unstubAllEnvs() })

describe('GET /board/refs', () => {
  it('refuses a stranger: a reference is not published the way a look picture is', async () => {
    expect((await get(REL)).status).toBe(401)
  })

  it('serves a reference to a council session, kept in that browser and no shared cache', async () => {
    const r = await get(REL, 't0ken')

    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('image/jpeg')
    expect(r.headers.get('cache-control')).toContain('private')
    expect(await r.text()).toBe(BYTES)
  })

  it('serves it to the board owner on his own page', async () => {
    owner.isBoardOwner.mockResolvedValue(true)

    expect((await get(REL)).status).toBe(200)
  })

  it('refuses anything that is not a look refs folder, and any path that climbs out of one', async () => {
    expect((await get('board/council-board.html', 't0ken')).status).toBe(404)
    expect((await get('council/callsheets/stills/cc-cultivation-clothing/refs/../../../board/council-board.html', 't0ken')).status).toBe(404)
  })

  it('reads its bytes from the refs namespace, never from the one the public stills route serves by hash', async () => {
    // A reference left in `sha/` is exactly what leaked on 2026-11-09: 200 at /board/stills/sha/<sha>, 401 here.
    const mem = memoryBackend()
    setBackend(mem.backend)
    await storeObject(SHA, new TextEncoder().encode(BYTES), 'image/jpeg')
    await setEntries({ [REF]: { sha: SHA, type: 'image/jpeg', size: BYTES.length } })

    expect((await get(REL, 't0ken')).status).toBe(404)
    expect(await readObject(SHA)).not.toBeNull()      // still fetchable by the public route, which is why it must not be here
    expect(await readRefObject(SHA)).toBeNull()
    expect(artPath(['sha', `${SHA}.jpg`])).toBe(`sha/${SHA}.jpg`)
  })

  it('says so when the reference was never pushed', async () => {
    expect((await get('council/callsheets/stills/cc-cultivation-clothing/refs/no-such-source/sheet.jpg', 't0ken')).status).toBe(404)
  })
})
