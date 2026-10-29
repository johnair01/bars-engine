import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: async () => true }))

import { pageUrl, serveBoard, streamed } from '../serve'

describe('serveBoard', () => {
  it('patches the Send bar on the council page only', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, text: async () => 'x btn.hidden = !mcp || !n; y' }))
    const req = { url: 'https://bars-engine.vercel.app/board/council' } as never
    const council = await (await serveBoard(req, 'council')).text()
    expect(council).toContain('btn.hidden = true;')
    expect(council).toContain("const BOARD = \"council\"")
    expect(await (await serveBoard(req, 'nonprofit')).text()).toContain('btn.hidden = !mcp || !n;')
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

describe('streamed', () => {
  it('sends a page over 4.5 MB, multi-byte text included, unchanged', async () => {
    const html = '<p>é—</p>'.repeat(600_000)
    expect(await new Response(streamed(html)).text()).toBe(html)
  })
})
