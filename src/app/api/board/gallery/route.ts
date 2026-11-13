/**
 * @route GET /api/board/gallery
 * @entity SYSTEM
 * @description The asset gallery's read side: finished game assets as crates, and the planned places still empty. Reads
 *   two files the council pushed to the content store (council/gallery/crates.json and holes.json), 12 cards a page with
 *   a cursor. `view=recent` lists crates newest made first with `shelf`, his recent reviews; `view=holes` lists planned
 *   rows, cheapest first. Finished means a picture a round's proof line names. Read only.
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID), or COUNCIL_MENU_TOKEN for a session
 * @example GET /api/board/gallery?view=recent&cursor=12
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'
import { holes, recent } from '@/lib/board/gallery'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner()))
    return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const q = req.nextUrl.searchParams, view = q.get('view') ?? 'recent', cursor = q.get('cursor')
  if (view !== 'recent' && view !== 'holes')
    return NextResponse.json({ error: 'view is recent or holes' }, { status: 400 })
  const body = view === 'holes' ? await holes(cursor) : await recent(cursor)
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
