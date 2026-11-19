/**
 * @route POST /api/work/:id/:move
 * @entity SYSTEM
 * @description A worker's move on the ticket it claimed: heartbeat (extend the lease), done (with its result, a pull
 *   request link or a note), release (give it back to the lane's deck) or failed; and unhold, which lifts a hold (a held ticket goes back to ready). Work queues, slice 1;
 *   unhold: Board v2 part 2, slice 1b. retry: a failed ticket returns to the deck once a review of the failure
 *   exists and names it.
 * @permissions the token of the lane that holds the ticket, or COUNCIL_MENU_TOKEN (retry: council only)
 * @example POST /api/work/ckx123/retry {"aar":"COUNCIL/logs/AAR_2026-11-18_deepai-timeouts.md"}
 * @example POST /api/work/ckx123/done {"result":"https://github.com/wendell-britt/six-faces-council/pull/700","look":"lh-brass-look-3"}
 *   (`look` is optional: the board row of the look the voyage brought home; GET /api/work/rings reads it)
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isLane, laneCaller } from '@/lib/work/lanes'
import { moveTicket, retryTicket, unholdTicket } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
const MOVES = new Set(['heartbeat', 'done', 'release', 'failed', 'unhold', 'retry'])
/** The name of the review that justifies a retry: a path or a link, no spaces. */
const AAR = /^[A-Za-z0-9._:\/-]{3,300}$/

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; move: string }> }) {
  const { id, move } = await params
  if (!MOVES.has(move)) return NextResponse.json({ error: 'move must be heartbeat, done, release, failed, unhold or retry' }, { status: 404 })
  const t = await db.workTicket.findUnique({ where: { id }, select: { lane: true } })
  if (!t) return NextResponse.json({ error: 'No such ticket' }, { status: 404 })
  const who = isLane(t.lane) ? laneCaller(req, t.lane) : null
  if (!who) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { result?: unknown; look?: unknown; aar?: unknown }
  const result = typeof b.result === 'string' ? b.result.slice(0, 2000) : null
  if (move === 'unhold') {
    const u = await unholdTicket(db, id)
    if (!u.ok) return NextResponse.json({ error: u.error }, { status: u.status })
    return NextResponse.json({ ticket: { id: u.ticket.id, state: u.ticket.state, lane: u.ticket.lane } }, { headers: NO_STORE })
  }
  if (move === 'retry') {
    if (who !== 'council') return NextResponse.json({ error: 'retry is signed by council: a review of the failure is not the failed maker\'s to give' }, { status: 403 })
    const aar = typeof b.aar === 'string' && AAR.test(b.aar) ? b.aar : null
    if (!aar) return NextResponse.json({ error: 'retry needs aar: the path or link of the review that explains the failure' }, { status: 400 })
    const r = await retryTicket(db, id, aar, 'council', new Date())
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json({ ticket: { id: r.ticket.id, state: r.ticket.state, lane: r.ticket.lane } }, { headers: NO_STORE })
  }
  const look = typeof b.look === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(b.look) ? b.look : null
  const r = await moveTicket(db, id, who === 'lane' ? t.lane : null, move as 'done', result, new Date(), look)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ticket: { id: r.ticket.id, state: r.ticket.state, lane: r.ticket.lane,
    leaseUntil: r.ticket.leaseUntil, result: r.ticket.result } }, { headers: NO_STORE })
}
