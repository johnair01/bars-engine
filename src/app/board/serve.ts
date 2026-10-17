/** Shared serving logic for the board routes: /board (the Nonprofit Board) and /board/council (the Council
 * Board). Both pages are built artifacts on six-faces-council main, fetched with a five-minute cache, wrapped
 * in a document shell, and served only to the board's owner. Saves go to Postgres through /api/board/saves. */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { patchCouncilPage } from '@/lib/board/council-page'
import { boardShim } from './shim'

const PAGES: Record<string, string> = {
  nonprofit: process.env.BOARD_PAGE_URL
    || 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/board/nonprofit/nonprofit-board.html',
  council: 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/board/council-board.html',
}
const caches = new Map<string, { html: string; at: number }>()

/** The page as main last built it: a row that lands on main is on the board within five minutes, no republish. */
async function page(board: string): Promise<string | null> {
  const hit = caches.get(board)
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.html
  try {
    const r = await fetch(PAGES[board], { cache: 'no-store' })
    if (r.ok) { const raw = await r.text(), html = board === 'council' ? patchCouncilPage(raw) : raw; caches.set(board, { html, at: Date.now() }); return html }
  } catch { /* keep the last good copy */ }
  return hit?.html ?? null
}

/** The built page is a fragment (claude.ai supplies the document around it): no doctype, head, charset or viewport.
 * Served raw it would render in quirks mode, so it gets the document shell here, with the store shim first. */
export function wrap(html: string, board: string): string {
  const shim = boardShim(board, board === 'nonprofit' ? '/board' : `/board/${board}`)
  if (/<!doctype/i.test(html)) return html.replace(/<head[^>]*>/i, m => `${m}\n${shim}`)
  return `<!doctype html>\n<html lang="en"><head>\n<meta charset="utf-8">\n`
    + `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${shim}\n${html}`
}

export async function serveBoard(req: NextRequest, board: string): Promise<NextResponse> {
  if (!(await isBoardOwner()))
    return NextResponse.redirect(new URL(`/login?returnTo=/board${board === 'nonprofit' ? '' : '/' + board}`, req.url))
  const html = await page(board)
  if (!html) return new NextResponse('The board page could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  return new NextResponse(wrap(html, board), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY',
               'Referrer-Policy': 'same-origin' },
  })
}
