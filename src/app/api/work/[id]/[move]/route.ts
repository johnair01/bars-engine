/**
 * @route POST /api/work/:id/:move
 * @entity SYSTEM
 * @description A worker's move on the ticket it claimed: heartbeat (extend the lease), done (with its result, a pull
 *   request link or a note), release (give it back to the lane's deck) or failed. Work queues, slice 1.
 * @permissions the token of the lane that holds the ticket, or COUNCIL_MENU_TOKEN
 * @example POST /api/work/ckx123/done {"result":"https://github.com/wendell-britt/six-faces-council/pull/700"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isLane, laneCaller } from '@/lib/work/lanes'
import { moveTicket } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
const MOVES = new Set(['heartbeat', 'done', 'release', 'failed'])

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; move: string }> }) {
  const { id, move } = await params
  if (!MOVES.has(move)) return NextResponse.json({ error: 'move must be heartbeat, done, release or failed' }, { status: 404 })
  const t = await db.workTicket.findUnique({ where: { id }, select: { lane: true } })
  if (!t) return NextResponse.json({ error: 'No such ticket' }, { status: 404 })
  const who = isLane(t.lane) ? laneCaller(req, t.lane) : null
  if (!who) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { result?: unknown }
  const result = typeof b.result === 'string' ? b.result.slice(0, 2000) : null
  const r = await moveTicket(db, id, who === 'lane' ? t.lane : null, move as 'done', result)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ticket: { id: r.ticket.id, state: r.ticket.state, lane: r.ticket.lane,
    leaseUntil: r.ticket.leaseUntil, result: r.ticket.result } }, { headers: NO_STORE })
}
