import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/board/store', () => ({ latestDoc: vi.fn() }))
import { isLook, looksNamed, plainYes, readyDraftsFor } from '../ready-drafts'

const pr = (number: number, title: string, draft = true, ref = 'claude/x') =>
  ({ number, node_id: `N${number}`, title, body: '', head: { ref }, draft })

describe('ready drafts on his plain yes', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    vi.stubEnv('BOARD_GITHUB_TOKEN', '')
    vi.stubEnv('BOARD_DISPATCH_TOKEN', 'tok')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('knows a look id and the looks a pull request names', () => {
    expect(isLook('ctw-nook-look-2')).toBe(true)
    expect(isLook('wa-main-copy')).toBe(false)
    expect(looksNamed(pr(1, 'Build 3 (ctw-nook-look-2, ml-bench-look-1)'))).toEqual(['ctw-nook-look-2', 'ml-bench-look-1'])
  })

  it('takes an answer with no steer and nothing negative as a plain yes', () => {
    const row = { options: [{ v: 'A', label: 'Yes, build it' }, { v: 'B', label: 'Not yet' }] }
    expect(plainYes({ choice: 'A' }, row)).toBe(true)
    expect(plainYes({ choice: 'B' }, row)).toBe(false)
    expect(plainYes({ choice: 'A', steer: 'bigger' }, row)).toBe(false)
    expect(plainYes({}, row)).toBe(false)
  })

  it('readies a draft whose every named look has a plain yes, and leaves the rest', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => [
        pr(10, 'Build (ab-look-1)'), pr(11, 'Build (ab-look-1, cd-look-2)'), pr(12, 'Ready one (ab-look-1)', false),
        pr(13, 'Other (ef-look-1)')] })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: {} }) })
    const out = await readyDraftsFor('ab-look-1', async id => id !== 'cd-look-2')
    expect(out).toEqual([{ number: 10, looks: ['ab-look-1'], status: 'ready' }])
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('https://api.github.com/graphql')
    expect(JSON.parse(init.body).variables).toEqual({ id: 'N10' })
    expect(init.headers.Authorization).toBe('Bearer tok')
  })

  it('logs a refusal and never throws', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => [pr(10, 'Build (ab-look-1)')] })
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) })
    expect(await readyDraftsFor('ab-look-1', async () => true)).toEqual([{ number: 10, looks: ['ab-look-1'], status: 'refused' }])
    fetchMock.mockRejectedValueOnce(new Error('down'))
    expect(await readyDraftsFor('ab-look-1', async () => true)).toBe('failed')
  })

  it('does nothing without a token', async () => {
    vi.stubEnv('BOARD_DISPATCH_TOKEN', '')
    expect(await readyDraftsFor('ab-look-1')).toBe('no-token')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
