/**
 * @route GET /board/data.js
 * @entity SYSTEM
 * @description The Council Board's data as the script its page loads before it renders: `window.__BOARD_DATA__ = …`,
 *   read from bars-engine's own store and nothing else. The store's rows are the page's cards: positions, questions,
 *   terms, causes and battles, each in the order the record kept, with the answers he saved laid over them. The
 *   resolved, draws, morning and intake collections fold into the shapes the page reads. No pushed copy is read, so a
 *   store that answers nothing draws no board and names the fault (Wendell, 2026-11-05: "the Page shouldn't be carrying
 *   its own data. It should all be served via the API"; 2026-11-09: "the copy needs to stop being written. If the store
 *   is down the store is down. I don't want a fallback").
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { getCurrentPlayer } from '@/lib/auth'
import { boardData } from '@/lib/board/data'
import { originOf } from '@/lib/board/pictures'
import { streamed } from '../serve'

export const dynamic = 'force-dynamic'

/** A write that lands in the store shows on the next load of the page and of this script together. */
const HEADERS = {
  'Content-Type': 'text/javascript; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
}

/** A script that assigns nothing, so the page draws no board at all and the fault is named. */
const NOTHING = 'window.__BOARD_DATA__ = null;\n'

/** The board's data as the script body. The page reads it before its own tag, so a board that grows past the page's
 * size arrives here whole; U+2028 and U+2029 are legal JSON and were once illegal inside a JS object literal. */
export function script(json: string): string {
  const body = json.trim().replace(/;\s*$/, '').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  return `window.__BOARD_DATA__ = ${body};\n`
}

export async function GET(req: NextRequest) {
  if (!(await isBoardOwner())) {
    // Same rule as /board/council: a signed-in stranger is told so, because /login sends a signed-in player straight
    // back to returnTo and redirecting there loops.
    if (await getCurrentPlayer())
      return new NextResponse(
        "You are signed in here as a different account from the board's owner, so its data stays closed.",
        { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
    return NextResponse.redirect(new URL(`/login?returnTo=${encodeURIComponent('/board/council')}`, req.url))
  }
  const data = await boardData('council', originOf(req))
  if (!data) return new NextResponse(NOTHING, { status: 503, headers: HEADERS })
  // Streamed: the board's data is 2.2 MB today and Vercel buffers a function response under 4.5 MB.
  return new NextResponse(streamed(script(JSON.stringify(data))), { headers: HEADERS })
}
