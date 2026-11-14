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

  it('serves a large picture as a link to /api/board/picture, not as embedded base64', async () => {
    const big = 'data:image/png;base64,' + 'A'.repeat(5000)
    vi.mocked(latestDocs).mockResolvedValue({ rows: { q: { kind: 'questions', still: big, small: 'data:image/png;base64,AAAA' } } })
    const text = await (await GET(req())).text()
    expect(text).not.toContain(big)
    expect(text).toContain('/api/board/picture?board=council&c=rows&id=q&p=still')
    expect(text).toContain('data:image/png;base64,AAAA')
  })

  it('leaves a settled card and its resolved entry out of the page, but keeps a deferred one', async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      rows: { done: { kind: 'questions', q: 'settled' }, later: { kind: 'questions', q: 'deferred' }, open: { kind: 'questions', q: 'still open' } },
      resolved: { a: { kind: 'questions', id: 'done', decision: 'yes', recorded: '2026-11-01' },
                  b: { kind: 'questions', id: 'later', decision: 'deferred', recorded: '2026-11-01' } },
    })
    const text = await (await GET(req())).text()
    expect(text).not.toContain('settled')
    expect(text).toContain('deferred')
    expect(text).toContain('still open')
  })

  it('keeps a settled look that a mark can still find, so the mark does not turn into a cause to name', async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      rows: {
        look: { kind: 'questions', q: 'the look', href: 'https://x-preview.example.dev/a' },
        timed: { kind: 'questions', q: 'timed look' },
        gone: { kind: 'questions', q: 'unrelated' },
        m1: { kind: 'causes', pass: 'preview-marks', mark: { page: 'https://x-preview.example.dev/a', at: '2026-11-01T10:00:00Z' } },
        'mark-2': { kind: 'causes', mark: { page: 'https://other.dev/', at: '2026-11-02T10:00:00Z' } },
      },
      resolved: {
        a: { kind: 'questions', id: 'look', decision: 'A', recorded: '2026-11-03' },
        b: { kind: 'questions', id: 'timed', decision: 'A', saved_at: '2026-11-02T10:01:00Z' },
        c: { kind: 'questions', id: 'gone', decision: 'A', saved_at: '2026-11-02T12:00:00Z' },
      },
    })
    const data = await read(await GET(req()))
    const ids = (data.questions as { id: string }[]).map((q) => q.id)
    expect(ids).toContain('look')
    expect((data.resolved as { questions: Record<string, unknown> }).questions.timed).toBeDefined()
    expect(ids).not.toContain('gone')
  })

  it('sets the script headers a page load can cache against', async () => {
    vi.mocked(latestDocs).mockResolvedValue({ rows: { p: { kind: 'positions', pos: 'from the store' } } })
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
    vi.mocked(latestDocs).mockResolvedValue({ rows: { 'pos-1': { kind: 'positions', pos: 'secret' } } })
    const res = await GET(req())
    expect(res.status).toBe(403)
    expect(await res.text()).not.toContain('secret')
  })

  it('draws the lists out of the store rows, in the order the record kept', async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      rows: {
        'q-2': { kind: 'questions', q: 'the second question', order: 1 },
        'q-1': { kind: 'questions', q: 'the first question', order: 0 },
        'p-1': { kind: 'positions', pos: 'a saved position', faces: ['regent'], order: 0 },
      },
    })
    const data = await read(await GET(req()))
    expect(data.questions.map((q: { id: string }) => q.id)).toEqual(['q-1', 'q-2'])
    expect(data.positions).toEqual([{ id: 'p-1', pos: 'a saved position', faces: ['regent'] }])
    expect(Object.keys(data).sort()).toEqual(['positions', 'questions', 'resolved'])
    expect(data.resolved).toEqual({ positions: {}, questions: {}, terms: {}, causes: {} })
  })

  it('lays his saved answer over the card it belongs to, keeping its text', async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      rows: { build: { kind: 'questions', q: 'which way?', options: [{ v: 'a', label: 'A' }] } },
      questions: { build: { choice: 'a', savedAt: '2026-11-09T10:00:00Z' } },
    })
    const data = await read(await GET(req()))
    expect(data.questions).toEqual([{ id: 'build', q: 'which way?', options: [{ v: 'a', label: 'A' }],
      choice: 'a', savedAt: '2026-11-09T10:00:00Z' }])
  })

  it('folds the settled answers, the draws, the gather, the weather and the intake', async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      rows: { build: { kind: 'positions', pos: 'a position' } },
      resolved: { 'positions--build': { kind: 'positions', id: 'build', decision: 'stands', savedAt: '2026-10-02T12:00:00Z' } },
      draws: { 'bar-intake--bi-look-1': { deck: 'bar-intake', card: 'bi-look-1', at: '2026-11-02T20:23:29Z' } },
      morning: {
        gather: { date: '2026-11-02', gathered_at: '2026-11-03T10:36:23Z', savedAt: '2026-11-03T10:36:23Z' },
        'weather--2026-11-02T07:00:00Z': { feeling: 'tender', pick: 'wv-tender', savedAt: '2026-11-02T07:00:00Z' },
      },
      intake: { latest: { date: '2026-10-21', items: [], savedAt: '2026-10-22T02:01:09Z' } },
    })
    const data = await read(await GET(req()))
    // A settled card leaves the page with its resolved entry; the store keeps both.
    expect(data.resolved.positions.build).toBeUndefined()
    expect(data.positions).toEqual([])
    expect(data.draws).toEqual({ 'bar-intake--bi-look-1': { deck: 'bar-intake', card: 'bi-look-1', at: '2026-11-02T20:23:29Z' } })
    expect(data.morning).toEqual({ date: '2026-11-02', gathered_at: '2026-11-03T10:36:23Z' })
    expect(data.weather_log['weather--2026-11-02T07:00:00Z'].feeling).toBe('tender')
    expect(data.intake).toEqual({ date: '2026-10-21', items: [] })
  })

  it('serves a battle from its own row, in the order the record kept', async () => {
    vi.mocked(latestDocs).mockResolvedValue({
      rows: {
        second: { kind: 'battles', name: 'Second', rounds: [], order: 1 },
        first: { kind: 'battles', name: 'First', rounds: [], order: 0 },
      },
    })
    const data = await read(await GET(req()))
    expect(data.battles).toEqual([{ id: 'first', name: 'First', rounds: [] },
      { id: 'second', name: 'Second', rounds: [] }])
  })
})
