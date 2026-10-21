/**
 * @route GET|POST /api/board/import
 * @entity SYSTEM
 * @description Move documents from the claude.ai artifact store into a board's store here (POST), and count what the
 *   store holds per collection (GET), so a session can carry the store across and check it landed. Appends only:
 *   identical documents are skipped and nothing is overwritten (src/lib/board/import.ts).
 * @permissions BOARD_IMPORT_TOKEN in the x-board-import-token header; the route is off while that variable is unset,
 *   which is its resting state between imports
 * @example POST /api/board/import {"board":"council","docs":[{"collection":"lists","docId":"a","data":{...}}],"dry":true}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tokenMatches } from '@/lib/council/token'
import { latestDocs } from '@/lib/board/store'
import { parseBoard } from '@/lib/board/save'
import { importDocs, type ImportDoc } from '@/lib/board/import'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_DOCS = 200

// A header of its own: the egress proxy that sessions use sets Authorization for bars-engine itself.
function refused(req: NextRequest) {
  const secret = process.env.BOARD_IMPORT_TOKEN
  if (!secret) return NextResponse.json({ error: 'BOARD_IMPORT_TOKEN not configured' }, { status: 503 })
  if (!tokenMatches(req.headers.get('x-board-import-token'), secret))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function GET(req: NextRequest) {
  const no = refused(req); if (no) return no
  const board = parseBoard(req.nextUrl.searchParams.get('board'))
  if (!board) return NextResponse.json({ error: 'board must be nonprofit or council' }, { status: 400 })
  const docs = (await latestDocs(board)) as Record<string, Record<string, unknown>>
  const counts = Object.fromEntries(Object.entries(docs).map(([c, d]) => [c, Object.keys(d).length]))
  return NextResponse.json({ board, counts }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const no = refused(req); if (no) return no
  const b = (await req.json().catch(() => null)) as { board?: string; docs?: unknown; dry?: unknown } | null
  const board = parseBoard(b?.board)
  if (!b || !board) return NextResponse.json({ error: 'board must be nonprofit or council' }, { status: 400 })
  if (!Array.isArray(b.docs) || b.docs.length > MAX_DOCS
      || !b.docs.every(d => d && typeof d.collection === 'string' && typeof d.docId === 'string'))
    return NextResponse.json({ error: `Expected {board, docs: [{collection, docId, data}] (at most ${MAX_DOCS})}` },
      { status: 400 })
  const r = await importDocs(db, board, b.docs as ImportDoc[], b.dry === true)
  return NextResponse.json({ board, dry: b.dry === true, ...r }, { headers: NO_STORE })
}
