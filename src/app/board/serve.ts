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

/** A Vercel preview may serve the Council Board from a six-faces-council branch (`?page=<branch>`), so a pair of pull
 * requests can be tried together before either merges. Production always serves main. */
export function pageUrl(board: string, branch: string | null, env = process.env.VERCEL_ENV): string {
  if (board !== 'council' || !branch || env === 'production' || !/^[A-Za-z0-9._-][A-Za-z0-9._/-]{0,99}$/.test(branch)
      || branch.includes('..')) return PAGES[board]
  return `https://raw.githubusercontent.com/wendell-britt/Six-faces-council/${branch}/board/council-board.html`
}

/** The page as main last built it: a row that lands on main is on the board within five minutes, no republish. */
async function page(board: string, url = PAGES[board]): Promise<string | null> {
  const hit = caches.get(url)
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.html
  try {
    const r = await fetch(url, { cache: 'no-store' })
    if (r.ok) { const raw = await r.text(), html = board === 'council' ? patchCouncilPage(raw) : raw; caches.set(url, { html, at: Date.now() }); return html }
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

/** Vercel refuses a buffered function response over 4.5 MB, and the Council Board page passed that on 2026-10-27 (its
 * look stills ride inside it). A streamed body is not held to the cap, so the page goes out in 256 KB pieces. */
export function streamed(html: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(html), PIECE = 256 * 1024
  let at = 0
  return new ReadableStream({
    pull(c) { c.enqueue(bytes.subarray(at, at += PIECE)); if (at >= bytes.length) c.close() },
  })
}

export async function serveBoard(req: NextRequest, board: string): Promise<NextResponse> {
  if (!(await isBoardOwner()))
    return NextResponse.redirect(new URL(`/login?returnTo=${encodeURIComponent(`/board${board === 'nonprofit' ? '' : '/' + board}${req.nextUrl?.search ?? ''}`)}`, req.url))
  const html = await page(board, pageUrl(board, req.nextUrl?.searchParams.get('page') ?? null))
  if (!html) return new NextResponse('The board page could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  return new NextResponse(streamed(wrap(html, board)), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY',
               'Referrer-Policy': 'same-origin' },
  })
}
