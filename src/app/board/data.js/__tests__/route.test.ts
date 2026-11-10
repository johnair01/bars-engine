import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: vi.fn(async () => true) }))
vi.mock('@/lib/auth', () => ({ getCurrentPlayer: vi.fn(async () => null) }))
vi.mock('@/lib/board/store', () => ({ latestDocs: vi.fn(async () => ({})) }))

import { DATA_PATH, GET } from '../route'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'
import { isBoardOwner } from '@/lib/board/owner'
import { getCurrentPlayer } from '@/lib/auth'
import { latestDocs } from '@/lib/board/store'

const BOARD = JSON.stringify({ updated: '2026-11-05T00:00:00Z', positions: [{ id: 'pos-1', text: 'one' }] })
const req = () => ({ url: 'https://bars-engine.vercel.app/board/data.js' }) as never

beforeEach(() => {
  vi.mocked(isBoardOwner).mockResolvedValue(true)
  vi.mocked(getCurrentPlayer).mockResolvedValue(null)
  vi.mocked(latestDocs).mockResolvedValue({})
  setBackend(memoryBackend({ [DATA_PATH]: BOARD }).backend)
})

describe('GET /board/data.js', () => {
  it('hands the page the pushed copy when the store holds nothing live', async () => {
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

  it('assigns nothing when the pushed copy is not JSON and the store holds nothing', async () => {
    setBackend(memoryBackend({ [DATA_PATH]: 'not json' }).backend)
    const res = await GET(req())
    expect(res.status).toBe(503)
    expect(await res.text()).toBe('window.__BOARD_DATA__ = null;\n')
  })

  it('draws the live collections from the store, under the record it cannot answer', async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      positions: { 'store-1': { id: 'store-1', pos: 'a saved position', faces: ['regent'] } },
      questions: { 'q-1': { id: 'q-1', q: 'a saved question' } },
    })
    const res = await GET(req())
    expect(res.status).toBe(200)
    const data = JSON.parse((await res.text()).replace(/^window.__BOARD_DATA__ = /, '').replace(/;\n$/, ''))
    expect(data.positions).toEqual([{ id: 'store-1', pos: 'a saved position', faces: ['regent'] }])
    expect(data.questions).toEqual([{ id: 'q-1', q: 'a saved question' }])
    expect(data.updated).toBe('2026-11-05T00:00:00Z')
  })

  it('serves the store alone when nothing was ever pushed', async () => {
    setBackend(memoryBackend({}).backend)
    vi.mocked(latestDocs).mockResolvedValue({ positions: { p: { id: 'p', pos: 'from the store' } } })
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('from the store')
  })
})
