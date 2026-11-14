import { createHash } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { setBackend, setEntries, storeObject } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'

vi.mock('@/lib/board/owner', () => ({ isBoardOwner: async () => false }))
import { GET } from '../route'

const URL_ = 'https://bars-engine.vercel.app/api/board/gallery'
const auth = { authorization: 'Bearer t0ken' }
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

async function push(path: string, rows: unknown[]) {
  const text = JSON.stringify({ rows }), h = sha(text)
  await storeObject(h, new TextEncoder().encode(text), 'application/json')
  await setEntries({ [path]: { sha: h, type: 'application/json', size: text.length } })
}
const crate = (i: number, extra = {}) => ({ sha: sha('c' + i), path: `council/callsheets/stills/r/${i}.jpg`, round: 'r',
  at: `2026-11-${String(i).padStart(2, '0')}T00:00:00Z`, maker: 'm', title: `crate ${i}`, type: 'image/jpeg', ...extra })

beforeEach(() => { vi.stubEnv('COUNCIL_MENU_TOKEN', 't0ken'); setBackend(memoryBackend().backend) })
afterEach(() => { setBackend(undefined); vi.unstubAllEnvs() })

describe('/api/board/gallery', () => {
  it('refuses a caller with neither the token nor the owner session', async () => {
    expect((await GET(new NextRequest(URL_))).status).toBe(401)
  })
  it('answers an empty store with no cards, not an error', async () => {
    const j = await (await GET(new NextRequest(URL_, { headers: auth }))).json()
    expect(j).toMatchObject({ view: 'recent', cards: [], shelf: [], next: null })
  })
  it('pages newest made first, 12 at a time, and the cursor reaches every crate once', async () => {
    await push('council/gallery/crates.json', Array.from({ length: 27 }, (_, i) => crate(i + 1)))
    const seen: string[] = []
    let cursor: string | null = null
    do {
      const j: { cards: { title: string }[]; next: string | null } = await (await GET(new NextRequest(`${URL_}?view=recent${cursor ? `&cursor=${cursor}` : ''}`, { headers: auth }))).json()
      expect(j.cards.length).toBeLessThanOrEqual(12)
      seen.push(...j.cards.map(c => c.title)); cursor = j.next
    } while (cursor)
    expect(seen).toHaveLength(27)
    expect(new Set(seen).size).toBe(27)
    expect(seen[0]).toBe('crate 27')
  })
  it('puts his recent reviews on the shelf, newest review first', async () => {
    await push('council/gallery/crates.json', [crate(1, { reviewed: { choice: 'A', at: '2026-11-11T02:00:00Z' } }), crate(2),
      crate(3, { reviewed: { choice: 'B', at: '2026-11-11T03:00:00Z' } })])
    const j = await (await GET(new NextRequest(`${URL_}?view=recent`, { headers: auth }))).json()
    expect(j.shelf.map((c: { title: string }) => c.title)).toEqual(['crate 3', 'crate 1'])
    expect(j.cards[0].picture).toBe(`/board/stills/sha/${sha('c3')}`)
  })
  it('lists holes cheapest first and refuses an unknown view', async () => {
    const hole = (id: string, tokens: number) => ({ id, node: 'n', class: 'dressing', name: id, pipe: 'code', price: { tokens, dollars: 0 } })
    await push('council/gallery/holes.json', [hole('n/b', 40000), hole('n/a', 30000)])
    const j = await (await GET(new NextRequest(`${URL_}?view=holes`, { headers: auth }))).json()
    expect(j.cards.map((h: { id: string }) => h.id)).toEqual(['n/a', 'n/b'])
    expect((await GET(new NextRequest(`${URL_}?view=all`, { headers: auth }))).status).toBe(400)
  })
  it('starts over on a bad cursor', async () => {
    await push('council/gallery/crates.json', [crate(1)])
    const j = await (await GET(new NextRequest(`${URL_}?cursor=zzz`, { headers: auth }))).json()
    expect(j.cards).toHaveLength(1)
  })
})
