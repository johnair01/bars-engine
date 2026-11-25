/**
 * @route GET /api/board/voice
 * @entity SYSTEM
 * @description The Teaching Desk's events (spec .specify/specs/voice-desk, FR-004): every save in the council board's
 *   `voice` collection after log number `after`, in seq order, at most 500, and `last`, the number to ask from next.
 *   `scripts/voice-export.ts` reads it and folds the events into content/voice/. Every document is returned, the later
 *   events of one docId included; the export keeps the latest per docId.
 * @permissions COUNCIL_MENU_TOKEN (a session), or the board owner's sign-in cookie
 * @example GET /api/board/voice?after=0
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
export const VOICE_PAGE = 500

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner()))
    return NextResponse.json({ error: 'Use the Council menu token or sign in as the board owner' }, { status: 401, headers: NO_STORE })
  const after = Number(req.nextUrl.searchParams.get('after') ?? '0')
  if (!Number.isSafeInteger(after) || after < 0)
    return NextResponse.json({ error: 'after is a log number, 0 or more' }, { status: 400, headers: NO_STORE })
  const rows = await db.boardSave.findMany({
    where: { board: 'council', collection: 'voice', seq: { gt: BigInt(after) } },
    orderBy: { seq: 'asc' }, take: VOICE_PAGE,
    select: { seq: true, docId: true, data: true, receivedAt: true },
  })
  const events = rows.map((r) => ({ seq: Number(r.seq), docId: r.docId, data: r.data as Record<string, unknown>,
    receivedAt: r.receivedAt.toISOString() }))
  return NextResponse.json({ events, last: events.length ? events[events.length - 1].seq : after }, { headers: NO_STORE })
}
