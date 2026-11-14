/**
 * @route GET /api/board/live
 * @entity SYSTEM
 * @description A Claude session reads the Council Board's store as it stands now: every document plus the saves
 *   main has not recorded, the same body as GET /api/board/pull?board=council. Read only (it records nothing), so
 *   it takes COUNCIL_MENU_TOKEN, the token the egress proxy already injects for sessions, and a session needs no
 *   BOARD_PULL_TOKEN to see Wendell's answers before a board-pull lands them on main (six-faces-council
 *   board/live.py, board row bl-q-live-read). ?board=nonprofit reads the Nonprofit Board the same way (default council;
 *   Wendell, 2026-11-02: "Gotta change the non-profit board as well to match the council board").
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token, a bare Authorization header or ?token=
 * @example GET /api/board/live  (or ?board=nonprofit)
 *
 * @route POST /api/board/live
 * @description A session marks council saves recorded once it has landed them (six-faces-council `board/read.py --live
 *   --record`), the same acknowledgement as POST /api/board/pull, so recording needs no BOARD_PULL_TOKEN and no
 *   board-pull Action (writers-api FR-001; Wendell, 2026-11-02: "Let's tackle these through API"). Header only: a
 *   write never takes its token from the URL. Body `board` defaults to council.
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or a bare Authorization header
 * @example POST /api/board/live {"board":"nonprofit","ids":["cm..."],"record":"session read 2026-11-02 recorded"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { latestDocs } from '@/lib/board/store'
import { parseBoard } from '@/lib/board/save'

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
  const raw = req.nextUrl.searchParams.get('board')
  const board = raw ? parseBoard(raw) : 'council'
  if (!board) return NextResponse.json({ error: 'board must be nonprofit or council' }, { status: 400 })
  const pending = await db.boardSave.findMany({
    where: { board, recordedAt: null }, orderBy: { receivedAt: 'asc' },
    select: { id: true, collection: true, docId: true, receivedAt: true },
  })
  return NextResponse.json({ board, docs: await latestDocs(board), unrecorded: pending }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const no = refused(req, true)
  if (no) return no
  const b = (await req.json().catch(() => null)) as { board?: string; ids?: unknown; record?: unknown; held?: unknown } | null
  if (!b || !Array.isArray(b.ids) || !b.ids.every(i => typeof i === 'string') || b.ids.length > 500
      || typeof b.record !== 'string' || !b.record.trim())
    return NextResponse.json({ error: 'Expected {ids: string[] (500 at most), record: string}' }, { status: 400 })
  const board = b.board ? parseBoard(b.board) : 'council'
  if (!board) return NextResponse.json({ error: 'board must be nonprofit or council' }, { status: 400 })
  const record = b.record.trim().slice(0, 300)
  // held: true marks saves the pull left for a session on purpose; they stay unrecorded but stop counting as waiting
  const held = b.held === true
  const r = await db.boardSave.updateMany({
    where: { board, id: { in: b.ids as string[] }, recordedAt: null },
    data: held ? { record } : { recordedAt: new Date(), record },
  })
  if (!held) await db.boardPull.create({ data: { board, recorded: r.count, record } })
  return NextResponse.json(held ? { recorded: 0, held: r.count } : { recorded: r.count }, { headers: NO_STORE })
}
