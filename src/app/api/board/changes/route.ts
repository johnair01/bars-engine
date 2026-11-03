/**
 * @route GET /api/board/changes
 * @entity SYSTEM
 * @description The board's change log (live board step 2, six-faces-council council/callsheets/live-board-design.md):
 *   every save on a board after log number `after`, oldest first, and `next`, the number to ask from on the next call.
 *   An open board page asks every few seconds and patches only the documents that changed, so a row a session posts or
 *   an answer saved on another device shows within seconds. `page` names the board's current build, as GET
 *   /api/board/saves does, so an open page can still tell when it is older than the board. The live database is the
 *   truth; this read is a view of it.
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID), or COUNCIL_MENU_TOKEN for a session
 * @example GET /api/board/changes?board=council&after=4182
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'
import { parseBoard } from '@/lib/board/save'
import { changesAfter } from '@/lib/board/store'
import { PAGE_PATHS, pushedSha } from '@/lib/board/content-store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner()))
    return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const q = req.nextUrl.searchParams
  const board = parseBoard(q.get('board'))
  if (!board) return NextResponse.json({ error: 'Unknown board' }, { status: 400 })
  const after = Number(q.get('after') ?? '0')
  if (!Number.isSafeInteger(after) || after < 0)
    return NextResponse.json({ error: 'after is a log number, 0 or more' }, { status: 400 })
  const [log, page] = await Promise.all([changesAfter(board, after),
    PAGE_PATHS[board] && !(board === 'nonprofit' && process.env.BOARD_PAGE_URL) ? pushedSha(PAGE_PATHS[board]) : null])
  return NextResponse.json({ ...log, page }, { headers: NO_STORE })
}
