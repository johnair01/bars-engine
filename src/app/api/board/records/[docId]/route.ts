/**
 * @route GET /api/board/records/[docId]
 * @entity SYSTEM
 * @description Serves one council record document by docId (six-faces-council .specify/specs/store-only, FR-004;
 *   Wendell's ruling so-prose-reading A, 2026-11-07: "bars-engine serves each record at a URL"). The record's body
 *   is the file's exact text, so a reader gets back what council/tools/log_push.py once wrote on main. The latest
 *   document for the docId is served; a record is born recorded, so no board-pull stands between the write and this
 *   read. Unknown docId answers 404. Auth mirrors POST /api/board/session-writes: the COUNCIL_MENU_TOKEN the
 *   egress proxy already injects for sessions, as a bearer token or ?token= — the same seal that writes a record
 *   reads one back, and the route takes no owner cookie, so a session can verify its own writes end to end.
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @example GET /api/board/records/store-only-1_2026-11-07
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { docId } = await params
  if (!docId || docId.length > 200) return NextResponse.json({ error: 'bad docId' }, { status: 400 })
  const doc = await db.boardSave.findFirst({
    where: { board: 'council', collection: 'records', docId },
    orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    select: { data: true, receivedAt: true },
  })
  if (!doc) return NextResponse.json({ error: `no record at records/${docId}` }, { status: 404 })
  return NextResponse.json({ docId, data: doc.data, receivedAt: doc.receivedAt }, { headers: NO_STORE })
}
