import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
vi.mock('@/lib/board/owner', () => owner)

const PAGE = '<title>Council Board</title><script>const PICKUP_TRIGGER = \'trig_01L138vKTaN9MSJoFKRmaBNx\';\n'
  + 'btn.hidden = !mcp || !n;\nelse msg.textContent = mcp ? `x` : `${what} saved. This view cannot reach Claude, so tell Claude in chat that you saved.`</script>'
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

import { GET } from '../route'

const req = () => ({ url: 'https://bars-engine.vercel.app/board/council' }) as never

describe('GET /board/council', () => {
  beforeEach(() => {
    owner.isBoardOwner.mockReset().mockResolvedValue(true)
    fetchMock.mockReset().mockResolvedValue({ ok: true, text: async () => PAGE })
  })

  it('sends a visitor who is not the owner to /login and returns to the council page', async () => {
    owner.isBoardOwner.mockResolvedValue(false)
    const res = await GET(req())
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://bars-engine.vercel.app/login?returnTo=/board/council')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('serves council-board.html from six-faces-council main with the council shim and the Send bar patched', async () => {
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/board/council-board.html')
    const html = await res.text()
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain("const BOARD = 'council'")
    expect(html).toContain('/login?returnTo=/board/council')
    expect(html).toContain("const PICKUP_TRIGGER = ''")
    expect(html).toContain('btn.hidden = true;')
    expect(html).toContain('Nobody needs telling.')
  })
})
