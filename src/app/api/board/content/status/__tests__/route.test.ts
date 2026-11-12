import { createHash } from 'crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { setBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'
import { DEFAULT_STALE_MINUTES, freshness, staleAfterMinutes } from '@/lib/board/content-freshness'
import { GET } from '../route'

const PAGE = 'board/council-board.html'
const sha = (s: string) => createHash('sha256').update(s).digest('hex')
const MIN = 60_000
const at = (minsAgo: number, now = Date.now()) => new Date(now - minsAgo * MIN).toISOString()

afterEach(() => { setBackend(undefined) })

describe('/api/board/content/status', () => {
  it('answers for the store the board reads, naming the page build being served', async () => {
    const page = '<p>the council board</p>'
    setBackend(memoryBackend({ [PAGE]: page }).backend)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.configured).toBe(true)
    expect(body.files).toBe(1)
    expect(body.pages[PAGE]).toEqual({ sha: sha(page), bytes: page.length })
    expect(body.at).toBe('2026-10-30T00:00:00Z')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('says how old the board is without saying what is on it', async () => {
    const page = '<p>a row only the board owner may read</p>'
    setBackend(memoryBackend({ [PAGE]: page }).backend)

    const text = JSON.stringify(await (await GET()).json())

    expect(text).not.toContain('a row only the board owner may read')
    expect(text).not.toContain('board/stills/')
  })

  it('counts the age from the manifest write, and calls a quiet board stale', () => {
    const now = Date.parse('2026-11-09T12:00:00Z')

    expect(freshness({ at: at(10, now), files: {} }, now).ageMinutes).toBe(10)
    expect(freshness({ at: at(10, now), files: {} }, now).stale).toBe(false)
    expect(freshness({ at: at(DEFAULT_STALE_MINUTES + 1, now), files: {} }, now).stale).toBe(true)

    // A manifest nobody wrote is not a young one.
    expect(freshness({ at: '', files: {} }, now)).toMatchObject({ ageMinutes: null, stale: true })
  })

  it('takes its threshold from BOARD_CONTENT_STALE_MINUTES', () => {
    expect(staleAfterMinutes({ BOARD_CONTENT_STALE_MINUTES: '30' })).toBe(30)
    expect(staleAfterMinutes({ BOARD_CONTENT_STALE_MINUTES: 'nonsense' })).toBe(DEFAULT_STALE_MINUTES)
    expect(staleAfterMinutes({})).toBe(DEFAULT_STALE_MINUTES)

    const now = Date.parse('2026-11-09T12:00:00Z')
    expect(freshness({ at: at(120, now), files: {} }, now, 180).stale).toBe(false)
  })

  it('says 503, not a healthy age, when no store was ever connected', async () => {
    setBackend(null)

    const res = await GET()

    expect(res.status).toBe(503)
    expect((await res.json()).configured).toBe(false)
  })
})
