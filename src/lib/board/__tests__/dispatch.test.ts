import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
import { dispatchBoardPull, resetDispatchThrottle } from '../dispatch'

describe('dispatchBoardPull', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 204 })
    vi.stubEnv('BOARD_DISPATCH_TOKEN', 'tok')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    resetDispatchThrottle()
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('posts the workflow dispatch for main with the token', async () => {
    expect(await dispatchBoardPull(1_000_000)).toBe('sent')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/repos/wendell-britt/Six-faces-council/actions/workflows/board-pull.yml/dispatches')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(init.body)).toEqual({ ref: 'main' })
  })

  it('does nothing without a token', async () => {
    vi.stubEnv('BOARD_DISPATCH_TOKEN', '')
    expect(await dispatchBoardPull(1_000_000)).toBe('no-token')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends at most one call a minute', async () => {
    expect(await dispatchBoardPull(1_000_000)).toBe('sent')
    expect(await dispatchBoardPull(1_030_000)).toBe('throttled')
    expect(await dispatchBoardPull(1_060_001)).toBe('sent')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('logs and returns failed on a refusal or a thrown error, never throwing', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 })
    expect(await dispatchBoardPull(1_000_000)).toBe('failed')
    fetchMock.mockRejectedValueOnce(new Error('network'))
    expect(await dispatchBoardPull(2_000_000)).toBe('failed')
    expect(console.error).toHaveBeenCalledTimes(2)
  })
})
