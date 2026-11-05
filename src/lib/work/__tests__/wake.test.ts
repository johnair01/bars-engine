import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { resetWakeThrottle, wakePickup, wakeStatus, WAKE_THROTTLE_MS } from '../wake'

describe('answers start the work: the pickup wake', () => {
  afterEach(() => {
    delete process.env.PICKUP_ROUTINE_FIRE_URL; delete process.env.PICKUP_ROUTINE_TOKEN
    resetWakeThrottle(); vi.unstubAllGlobals()
  })

  it('does nothing until the routine trigger is set', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f)
    expect(await wakePickup('answer to lb-start')).toBe('not-set')
    expect(f).not.toHaveBeenCalled()
  })

  it('fires the routine once per short window, with its token', async () => {
    process.env.PICKUP_ROUTINE_FIRE_URL = 'https://api.anthropic.com/v1/claude_code/routines/trig_x/fire'
    process.env.PICKUP_ROUTINE_TOKEN = 'tok'
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })); vi.stubGlobal('fetch', f)
    expect(await wakePickup('answer to lb-start', 1_000_000)).toBe('sent')
    const [url, init] = f.mock.calls[0]
    expect(url).toBe(process.env.PICKUP_ROUTINE_FIRE_URL)
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(init.body).text).toContain('lb-start')
    expect(await wakePickup('again', 1_000_000 + WAKE_THROTTLE_MS - 1)).toBe('throttled')
    expect(await wakePickup('later', 1_000_000 + WAKE_THROTTLE_MS)).toBe('sent')
  })

  it('never throws when claude.ai refuses', async () => {
    process.env.PICKUP_ROUTINE_FIRE_URL = 'https://example.test/fire'; process.env.PICKUP_ROUTINE_TOKEN = 'tok'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 403 })))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(await wakePickup('x')).toBe('failed')
  })

  it('reports whether it is set and which routine, never the token', async () => {
    expect(wakeStatus()).toMatchObject({ urlSet: false, tokenSet: false, routine: null })
    process.env.PICKUP_ROUTINE_FIRE_URL = 'https://api.anthropic.com/v1/claude_code/routines/trig_abc123/fire'
    process.env.PICKUP_ROUTINE_TOKEN = 'secret'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 401 })))
    await wakePickup('x', 5_000_000)
    const s = wakeStatus()
    expect(s).toMatchObject({ urlSet: true, tokenSet: true, routine: 'trig_abc123' })
    expect(s.lastOnThisInstance).toMatchObject({ result: 'failed', status: 401 })
    expect(JSON.stringify(s)).not.toContain('secret')
  })
})
