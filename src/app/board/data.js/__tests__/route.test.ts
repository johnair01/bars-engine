import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: vi.fn(async () => true) }))
vi.mock('@/lib/auth', () => ({ getCurrentPlayer: vi.fn(async () => null) }))

import { GET } from '../route'
import { DATA_PATH } from '@/lib/board/data-script'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'
import { isBoardOwner } from '@/lib/board/owner'
import { getCurrentPlayer } from '@/lib/auth'

const BOARD = JSON.stringify({ updated: '2026-11-05T00:00:00Z', positions: [{ id: 'pos-1', text: 'one' }] })
const req = () => ({ url: 'https://bars-engine.vercel.app/board/data.js' }) as never

beforeEach(() => {
  vi.mocked(isBoardOwner).mockResolvedValue(true)
  vi.mocked(getCurrentPlayer).mockResolvedValue(null)
  setBackend(memoryBackend({ [DATA_PATH]: BOARD }).backend)
})

describe('GET /board/data.js', () => {
  it('hands the page the pushed copy as the script it reads before its own data tag', async () => {
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/javascript; charset=utf-8')
    expect(res.headers.get('cache-control')).toBe('no-store')
    const body = await res.text()
    expect(body.startsWith('window.__BOARD_DATA__ = {')).toBe(true)
    expect(body.endsWith('};\n')).toBe(true)
    expect(JSON.parse(body.replace(/^window.__BOARD_DATA__ = /, '').replace(/;\n$/, ''))).toEqual(JSON.parse(BOARD))
  })

  it('sends a visitor with no sign-in to login, and back to the board afterwards', async () => {
    vi.mocked(isBoardOwner).mockResolvedValue(false)
    const res = await GET(req())
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login?returnTo=%2Fboard%2Fcouncil')
  })

  it('closes for a signed-in visitor who is not the owner, and hands over no data', async () => {
    vi.mocked(isBoardOwner).mockResolvedValue(false)
    vi.mocked(getCurrentPlayer).mockResolvedValue({ id: 'someone-else' } as never)
    const res = await GET(req())
    expect(res.status).toBe(403)
    expect(await res.text()).not.toContain('pos-1')
  })

  it('assigns nothing before anything was pushed, so the page draws the copy it carries', async () => {
    setBackend(memoryBackend({}).backend)
    const res = await GET(req())
    expect(res.status).toBe(503)
    expect(await res.text()).toBe('window.__BOARD_DATA__ = null;\n')
  })

  it('assigns nothing when the pushed copy is not JSON', async () => {
    setBackend(memoryBackend({ [DATA_PATH]: 'not json' }).backend)
    const res = await GET(req())
    expect(res.status).toBe(503)
    expect(await res.text()).toBe('window.__BOARD_DATA__ = null;\n')
  })
})
