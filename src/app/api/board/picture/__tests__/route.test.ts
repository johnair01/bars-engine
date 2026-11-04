import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
const store = vi.hoisted(() => ({ latestDoc: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/board/owner', () => owner)
vi.mock('@/lib/board/store', () => store)

import { GET } from '../route'
import { pictureHash } from '@/lib/board/pictures'

const pic = 'data:image/jpeg;base64,' + Buffer.from('y'.repeat(4000)).toString('base64')
const req = (q: string) => ({ nextUrl: { searchParams: new URLSearchParams(q) }, headers: new Headers() }) as never

describe('GET /api/board/picture', () => {
  beforeEach(() => { vi.resetAllMocks(); owner.isBoardOwner.mockResolvedValue(true) })

  it('serves the picture a link names, kept by the browser for good', async () => {
    store.latestDoc.mockResolvedValue({ files: [{ src: pic }] })
    const r = await GET(req(`board=council&c=steps&id=look-1&p=files.0.src&h=${pictureHash(pic)}`))
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('image/jpeg')
    expect(r.headers.get('cache-control')).toContain('immutable')
    expect(Buffer.from(await r.arrayBuffer()).toString()).toBe('y'.repeat(4000))
    expect(store.latestDoc).toHaveBeenCalledWith('council', 'steps', 'look-1')
  })

  it('answers 404 once the document holds another picture, and 401 to a stranger', async () => {
    store.latestDoc.mockResolvedValue({ still: pic })
    expect((await GET(req('board=council&c=steps&id=look-1&p=still&h=0000000000000000'))).status).toBe(404)
    owner.isBoardOwner.mockResolvedValue(false)
    expect((await GET(req(`board=council&c=steps&id=look-1&p=still&h=${pictureHash(pic)}`))).status).toBe(401)
  })
})
