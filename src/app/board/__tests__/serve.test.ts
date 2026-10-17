import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: async () => true }))

import { serveBoard } from '../serve'

describe('serveBoard', () => {
  it('patches the Send bar on the council page only', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, text: async () => 'x btn.hidden = !mcp || !n; y' }))
    const req = { url: 'https://bars-engine.vercel.app/board/council' } as never
    const council = await (await serveBoard(req, 'council')).text()
    expect(council).toContain('btn.hidden = true;')
    expect(council).toContain("const BOARD = \"council\"")
    expect(await (await serveBoard(req, 'nonprofit')).text()).toContain('btn.hidden = !mcp || !n;')
  })
})
