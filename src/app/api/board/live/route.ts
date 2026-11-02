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
 *
 * @route POST /api/board/live
 * @description A session marks council saves recorded once it has landed them (six-faces-council `board/read.py --live
 *   --record`), the same acknowledgement as POST /api/board/pull, so recording needs no BOARD_PULL_TOKEN and no
 *   board-pull Action (writers-api FR-001; Wendell, 2026-11-02: "Let's tackle these through API"). Header only: a
 *   write never takes its token from the URL. Council board only.
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or a bare Authorization header
 * @example POST /api/board/live {"ids":["cm..."],"record":"session read 2026-11-02 recorded"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { latestDocs } from '@/lib/board/store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

function refused(req: NextRequest, write = false) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503 })
  if (write && !req.headers.get('authorization')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function GET(req: NextRequest) {
  const no = refused(req)
  if (no) return no
  const pending = await db.boardSave.findMany({
    where: { board: 'council', recordedAt: null }, orderBy: { receivedAt: 'asc' },
    select: { id: true, collection: true, docId: true, receivedAt: true },
  })
  return NextResponse.json({ board: 'council', docs: await latestDocs('council'), unrecorded: pending }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const no = refused(req, true)
  if (no) return no
  const b = (await req.json().catch(() => null)) as { ids?: unknown; record?: unknown } | null
  if (!b || !Array.isArray(b.ids) || !b.ids.every(i => typeof i === 'string') || b.ids.length > 500
      || typeof b.record !== 'string' || !b.record.trim())
    return NextResponse.json({ error: 'Expected {ids: string[] (500 at most), record: string}' }, { status: 400 })
  const record = b.record.trim().slice(0, 300)
  const r = await db.boardSave.updateMany({
    where: { board: 'council', id: { in: b.ids as string[] }, recordedAt: null }, data: { recordedAt: new Date(), record },
  })
  await db.boardPull.create({ data: { board: 'council', recorded: r.count, record } })
  return NextResponse.json({ recorded: r.count }, { headers: NO_STORE })
}
