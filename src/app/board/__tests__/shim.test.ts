import { describe, expect, it } from 'vitest'
import { BOARD_SHIM, boardShim } from '../shim'

describe('board shim', () => {
  it('saves as the board it serves', () => {
    expect(boardShim('council', '/board/council')).toContain('const BOARD = "council"')
    expect(BOARD_SHIM).toContain('const BOARD = "nonprofit"')
  })

  it('redirects a stale session back to its own board page', () => {
    expect(boardShim('council', '/board/council')).toContain("'/login?returnTo=' + \"/board/council\"")
    expect(BOARD_SHIM).toContain("'/login?returnTo=' + \"/board\"")
  })

  it('still offers only the store and the same-origin Tap the Vein check', () => {
    const shim = boardShim('council')
    expect(shim).toContain("fetch(API + '?board=' + BOARD")
    expect(shim).toContain("server !== 'Vercel' || tool !== 'web_fetch_vercel_url'")
    expect(shim).not.toContain('fire_trigger')
  })
})
