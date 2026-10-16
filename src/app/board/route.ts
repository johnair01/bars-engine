/**
 * @route GET /board
 * @entity SYSTEM
 * @description The Nonprofit Board, served from six-faces-council main and saving to bars-engine
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { BOARD_SHIM } from './shim'

export const dynamic = 'force-dynamic'
const PAGE_URL = process.env.BOARD_PAGE_URL
  || 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/board/nonprofit/nonprofit-board.html'
let cache: { html: string; at: number } | null = null

/** The page as main last built it: a row that lands on main is on the board within five minutes, no republish. */
async function page(): Promise<string | null> {
  if (cache && Date.now() - cache.at < 5 * 60_000) return cache.html
  try {
    const r = await fetch(PAGE_URL, { cache: 'no-store' })
    if (r.ok) { cache = { html: await r.text(), at: Date.now() }; return cache.html }
  } catch { /* keep the last good copy */ }
  return cache?.html ?? null
}

/** The built page is a fragment (claude.ai supplies the document around it): no doctype, head, charset or viewport.
 * Served raw it would render in quirks mode, so it gets the document shell here, with the store shim first. */
export function wrap(html: string): string {
  if (/<!doctype/i.test(html)) return html.replace(/<head[^>]*>/i, m => `${m}\n${BOARD_SHIM}`)
  return `<!doctype html>\n<html lang="en"><head>\n<meta charset="utf-8">\n`
    + `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${BOARD_SHIM}\n${html}`
}

export async function GET(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.redirect(new URL('/login?returnTo=/board', req.url))
  const html = await page()
  if (!html) return new NextResponse('The board page could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  const out = wrap(html)
  return new NextResponse(out, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY',
               'Referrer-Policy': 'same-origin' },
  })
}
