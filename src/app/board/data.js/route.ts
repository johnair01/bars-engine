/**
 * @route GET /board/data.js
 * @entity SYSTEM
 * @description The Council Board's data as the script its page loads before it renders: `window.__BOARD_DATA__ = …`,
 *   read from the copy the council pushes here (board/board_data.json), so the page no longer carries its own data
 *   (Wendell, 2026-11-05: "the Page shouldn't be carrying its own data. It should all be served via the API")
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { getCurrentPlayer } from '@/lib/auth'
import { readText } from '@/lib/board/content-store'
import { DATA_PATH, script } from '@/lib/board/data-script'
import { streamed } from '../serve'

export const dynamic = 'force-dynamic'

/** The page's own rule: a push that lands in the store shows on the next load of the page and of this script together. */
const HEADERS = {
  'Content-Type': 'text/javascript; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
}

/** A script that assigns nothing, so the page falls back to the copy it carries instead of drawing an empty board. */
const NOTHING = 'window.__BOARD_DATA__ = null;\n'

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
  const json = await readText(DATA_PATH)
  if (!json) return new NextResponse(NOTHING, { status: 503, headers: HEADERS })
  try {
    JSON.parse(json)
  } catch {
    return new NextResponse(NOTHING, { status: 503, headers: HEADERS })
  }
  // Streamed: the board's data is 2.2 MB today and Vercel buffers a function response under 4.5 MB.
  return new NextResponse(streamed(script(json)), { headers: HEADERS })
}
