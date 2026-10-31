import { createHash } from 'crypto'
import { describe, expect, it, vi } from 'vitest'
import { artPath, lookPage, serveArt } from '../art'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'

describe('artPath', () => {
  it('passes board stills and callsheet stills, nothing else', () => {
    expect(artPath(['94a1067981bd2ba3.jpg'])).toBe('board/stills/94a1067981bd2ba3.jpg')
    expect(artPath('council/callsheets/stills/2026-10-30-cultivation-parts-2/frames/a.png'.split('/')))
      .toBe('council/callsheets/stills/2026-10-30-cultivation-parts-2/frames/a.png')
    expect(artPath(['council', 'callsheets', 'stills', '..', '..', 'faces.yaml'])).toBeNull()
    expect(artPath(['council', 'faces.yaml'])).toBeNull()
    expect(artPath(['board', 'board_data.json'])).toBeNull()
    expect(artPath(['notes.png'])).toBeNull()
    expect(artPath(['%E0%A4%A.png'])).toBeNull()
  })
})

describe('serveArt', () => {
  it('serves a pushed still from the store, caches it for good, and refuses a path outside the stills', async () => {
    const seen: string[] = []
    vi.stubGlobal('fetch', async (u: string) => { seen.push(u); return { ok: false } })
    const mem = memoryBackend({ 'board/stills/94a1067981bd2ba3.jpg': 'jpeg bytes' })
    setBackend(mem.backend)
    const r = await serveArt(['94a1067981bd2ba3.jpg'])
    expect(await r.text()).toBe('jpeg bytes')
    expect(seen).toEqual([])
    expect(r.headers.get('content-type')).toBe('image/jpeg')
    expect(r.headers.get('cache-control')).toContain('immutable')
    expect((await serveArt(['..', 'x.png'])).status).toBe(404)
    expect((await serveArt(['0000000000000000.png'])).status).toBe(404)
    setBackend(undefined)
  })
})

describe('lookPage', () => {
  it('shows each picture from this host, escaped, and drops paths it will not serve', () => {
    const html = lookPage('Round <3>', ['council/callsheets/stills/r/frames/a.png', 'board/stills/94a1067981bd2ba3.jpg', 'council/x.png'])
    expect(html).toContain('Round &lt;3&gt;')
    expect(html).toContain('src="/board/stills/council/callsheets/stills/r/frames/a.png"')
    expect(html).toContain('src="/board/stills/94a1067981bd2ba3.jpg"')
    expect(html).not.toContain('council/x.png')
    expect(html).not.toContain('github.com')
  })
})

describe('pictures by hash (the seal)', () => {
  it('serves a stored object by its full hash with no manifest entry, and 404s one the store lacks', async () => {
    const mem = memoryBackend()
    const sha = createHash('sha256').update('png bytes').digest('hex')
    mem.objects.set('sha/' + sha, { bytes: new TextEncoder().encode('png bytes'), type: 'image/png' })
    setBackend(mem.backend)
    expect(artPath(['sha', `${sha}.png`])).toBe(`sha/${sha}.png`)
    expect(artPath(['sha', 'abc.png'])).toBeNull()
    const r = await serveArt(['sha', `${sha}.png`])
    expect(await r.text()).toBe('png bytes')
    expect(r.headers.get('content-type')).toBe('image/png')
    expect(r.headers.get('cache-control')).toContain('immutable')
    expect((await serveArt(['sha', `${'0'.repeat(64)}.png`])).status).toBe(404)
    expect(lookPage('t', [`sha/${sha}.png`])).toContain(`src="/board/stills/sha/${sha}.png"`)
    setBackend(undefined)
  })
})
