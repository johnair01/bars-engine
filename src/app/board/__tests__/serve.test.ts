import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: async () => true }))

import { pageUrl, serveBoard, streamed, wrap } from '../serve'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'

describe('serveBoard', () => {
  it('patches the Send bar on the council page only', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('the repo is private: nothing may fetch it') })
    const page = 'x btn.hidden = !mcp || !n; y'
    setBackend(memoryBackend({ 'board/council-board.html': page, 'board/nonprofit/nonprofit-board.html': page }).backend)
    const req = { url: 'https://bars-engine.vercel.app/board/council' } as never
    const council = await (await serveBoard(req, 'council')).text()
    expect(council).toContain('btn.hidden = true;')
    expect(council).toContain("const BOARD = \"council\"")
    expect(await (await serveBoard(req, 'nonprofit')).text()).toContain('btn.hidden = !mcp || !n;')
    setBackend(undefined)
  })

  it('answers 503, not a GitHub fetch, before anything was pushed', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('the repo is private: nothing may fetch it') })
    vi.resetModules()
    const store = await import('@/lib/board/content-store'), fresh = await import('../serve')
    store.setBackend(memoryBackend().backend)
    const req = { url: 'https://bars-engine.vercel.app/board/council' } as never
    expect((await fresh.serveBoard(req, 'council')).status).toBe(503)
    store.setBackend(undefined)
  })

  it('serves a six-faces-council branch only on a preview, and only the council page', () => {
    const main = 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/board/council-board.html'
    expect(pageUrl('council', 'claude/x-1', 'preview')).toBe(main.replace('/main/', '/claude/x-1/'))
    expect(pageUrl('council', 'claude/x-1', 'production')).toBe(main)
    expect(pageUrl('council', '../../evil', 'preview')).toBe(main)
    expect(pageUrl('council', null, 'preview')).toBe(main)
    expect(pageUrl('nonprofit', 'claude/x-1', 'preview')).not.toContain('claude/x-1')
  })
})

describe('wrap', () => {
  it('links the shared --ui-* tokens and lets them follow the device (unified UI build 2)', () => {
    const council = wrap('<p>board</p>', 'council')
    expect(council).toContain('<html lang="en" data-theme="auto">')
    expect(council).toContain('<link rel="stylesheet" href="/ui/tokens.css">')
    expect(council).toContain('family=Atkinson+Hyperlegible')
    const whole = wrap('<!doctype html><html lang="en"><head><title>t</title></head><body></body></html>', 'nonprofit')
    expect(whole).toContain('<html lang="en" data-theme="auto">')
    expect(whole).toContain('href="/ui/tokens.css"')
    expect(wrap('<!doctype html><html data-theme="light"><head></head></html>', 'nonprofit')).toContain('<html data-theme="light">')
  })
})

describe('streamed', () => {
  it('sends a page over 4.5 MB, multi-byte text included, unchanged', async () => {
    const html = '<p>é—</p>'.repeat(600_000)
    expect(await new Response(streamed(html)).text()).toBe(html)
  })
})
