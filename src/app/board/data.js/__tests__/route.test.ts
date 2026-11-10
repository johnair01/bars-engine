import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/board/owner', () => ({ isBoardOwner: vi.fn(async () => true) }))
vi.mock('@/lib/auth', () => ({ getCurrentPlayer: vi.fn(async () => null) }))
vi.mock('@/lib/board/store', () => ({ latestDocs: vi.fn(async () => ({})) }))

import { GET } from '../route'
import { isBoardOwner } from '@/lib/board/owner'
import { getCurrentPlayer } from '@/lib/auth'
import { latestDocs } from '@/lib/board/store'

const req = () => ({ url: 'https://bars-engine.vercel.app/board/data.js' }) as never
const read = async (res: Response) =>
  JSON.parse((await res.text()).replace(/^window.__BOARD_DATA__ = /, '').replace(/;\n$/, ''))

beforeEach(() => {
  vi.mocked(isBoardOwner).mockResolvedValue(true)
  vi.mocked(getCurrentPlayer).mockResolvedValue(null)
  vi.mocked(latestDocs).mockResolvedValue({})
})

describe('GET /board/data.js', () => {
  it('assigns nothing when the store holds nothing, so the page draws no board and no copy', async () => {
    const res = await GET(req())
    expect(res.status).toBe(503)
    expect(await res.text()).toBe('window.__BOARD_DATA__ = null;\n')
  })

  it('sets the script headers a page load can cache against', async () => {
    vi.mocked(latestDocs).mockResolvedValue({ positions: { p: { id: 'p', pos: 'from the store' } } })
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/javascript; charset=utf-8')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.text()).toContain('from the store')
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
    vi.mocked(latestDocs).mockResolvedValue({ positions: { 'pos-1': { id: 'pos-1' } } })
    const res = await GET(req())
    expect(res.status).toBe(403)
    expect(await res.text()).not.toContain('pos-1')
  })

  it('draws the live collections from the store, and nothing else', async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      positions: { 'store-1': { id: 'store-1', pos: 'a saved position', faces: ['regent'] } },
      questions: { 'q-1': { id: 'q-1', q: 'a saved question' } },
    })
    const res = await GET(req())
    expect(res.status).toBe(200)
    const data = await read(res)
    expect(data.positions).toEqual([{ id: 'store-1', pos: 'a saved position', faces: ['regent'] }])
    expect(data.questions).toEqual([{ id: 'q-1', q: 'a saved question' }])
    expect(Object.keys(data).sort()).toEqual(['positions', 'questions'])
  })

  it("folds the store's settled answers under their kind and id", async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      resolved: { 'positions--build': { kind: 'positions', id: 'build', savedAt: '2026-10-02T12:00:00Z',
        decision: 'stands', label: 'Stands', saved_at: '2026-10-02T12:00:00Z' } },
    })
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect((await read(res)).resolved.positions.build).toEqual(
      { decision: 'stands', label: 'Stands', saved_at: '2026-10-02T12:00:00Z' })
  })

  it("folds the store's draws, weather readings and gather into the shapes the page reads", async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      draws: { 'bar-intake--bi-anyone-look-1': { deck: 'bar-intake', card: 'bi-anyone-look-1', at: '2026-11-02T20:23:29Z' } },
      morning: {
        gather: { date: '2026-11-02', gathered_at: '2026-11-03T10:36:23Z', savedAt: '2026-11-03T10:36:23Z' },
        'weather--2026-11-02T07:00:00Z': { feeling: 'tender', pick: 'wv-tender', savedAt: '2026-11-02T07:00:00Z' },
      },
    })
    const res = await GET(req())
    expect(res.status).toBe(200)
    const data = await read(res)
    expect(data.draws).toEqual({ 'bar-intake--bi-anyone-look-1': { deck: 'bar-intake', card: 'bi-anyone-look-1', at: '2026-11-02T20:23:29Z' } })
    expect(data.morning).toEqual({ date: '2026-11-02', gathered_at: '2026-11-03T10:36:23Z' })
    expect(data.weather_log).toEqual({
      'weather--2026-11-02T07:00:00Z': { feeling: 'tender', pick: 'wv-tender', savedAt: '2026-11-02T07:00:00Z' },
    })
  })

  it("folds the intake's one run and the battles list, in the order the store kept", async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      intake: { latest: { date: '2026-10-21', items: [{ id: 'menu-task:1' }], savedAt: '2026-10-22T02:01:09Z' } },
      battles: { second: { id: 'second', name: 'Second', order: 1 }, first: { id: 'first', name: 'First', order: 0 } },
    })
    const res = await GET(req())
    expect(res.status).toBe(200)
    const data = await read(res)
    expect(data.intake).toEqual({ date: '2026-10-21', items: [{ id: 'menu-task:1' }] })
    expect(data.battles).toEqual([{ id: 'first', name: 'First' }, { id: 'second', name: 'Second' }])
  })
})
