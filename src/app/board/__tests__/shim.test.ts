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
    // the one fire_trigger it answers is a harbour berth's Send, saved as a ticket on bars-engine (e910dfb)
    expect(shim).toContain("server === 'Claude Code Remote' && tool === 'fire_trigger'")
    expect(shim).toContain("fetch('/api/work/send'")
  })

  it('emits a script that parses, so escapes in the template survive', () => {
    const body = boardShim('council').replace(/^<script>/, '').replace(/<\/script>$/, '')
    expect(() => new Function(body)).not.toThrow()
  })

  it('keeps typed words across a refresh, a re-render and a reload', () => {
    const shim = boardShim('council')
    expect(shim).toContain("const DKEY = 'board-drafts:' + BOARD")
    expect(shim).toContain('if (ready) show();')
    expect(shim).toContain('new MutationObserver(refill)')
    expect(shim).toContain('settle(data)')
  })

  it('names the page build it rides on, and offers the newer board when the store names another (board-reverts)', () => {
    const shim = boardShim('council', '/board/council', 'abc123')
    expect(shim).toContain('PAGE = "abc123"')
    expect(boardShim('council')).toContain('PAGE = null')
    expect(shim).toContain('j.page !== PAGE')
    expect(shim).toContain("id = 'board-stale'")
  })

  it('drops a refresh that went out before a save, so the old answer never comes back on screen', () => {
    const shim = boardShim('council')
    expect(shim).toContain('const asked = wrote;')
    expect(shim).toContain('if (asked !== wrote || writing) return;')
    expect(shim).toContain('writing++; wrote++;')
  })
})
