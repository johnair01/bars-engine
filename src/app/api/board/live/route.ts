/**
 * @route GET /api/board/live
 * @entity SYSTEM
 * @description A Claude session reads the Council Board's store as it stands now: every document plus the saves
 *   main has not recorded, the same body as GET /api/board/pull?board=council. Read only (it records nothing), so
 *   it takes COUNCIL_MENU_TOKEN, the token the egress proxy already injects for sessions, and a session needs no
 *   BOARD_PULL_TOKEN to see Wendell's answers before a board-pull lands them on main (six-faces-council
 *   board/live.py, board row bl-q-live-read). Council board only: the nonprofit board stays behind BOARD_PULL_TOKEN.
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token, a bare Authorization header or ?token=
 * @example GET /api/board/live
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { latestDocs } from '@/lib/board/store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const pending = await db.boardSave.findMany({
    where: { board: 'council', recordedAt: null }, orderBy: { receivedAt: 'asc' },
    select: { id: true, collection: true, docId: true, receivedAt: true },
  })
  return NextResponse.json({ board: 'council', docs: await latestDocs('council'), unrecorded: pending }, { headers: NO_STORE })
}
