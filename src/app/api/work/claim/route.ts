/**
 * @route POST /api/work/claim
 * @entity SYSTEM
 * @description A lane pulls its next piece of work: the oldest ready ticket in that lane, held for two hours (heartbeat
 *   extends it). The ticket carries the brief and his answer itself. 204 when the lane's deck is empty.
 *   Work queues, slice 1 (six-faces-council council/callsheets/work-queues.md, docs/work-queues.md).
 * @permissions the lane's own token (WORK_TOKEN_CLAUDE, WORK_TOKEN_FREEBUFF) or COUNCIL_MENU_TOKEN, as a bearer token
 * @example POST /api/work/claim?lane=claude {"by":"thread: Run gate wq-look-3"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isLane, laneCaller } from '@/lib/work/lanes'
import { claimTicket } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  const lane = req.nextUrl.searchParams.get('lane')
  if (!isLane(lane)) return NextResponse.json({ error: 'lane must be claude or freebuff' }, { status: 400 })
  if (!laneCaller(req, lane)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { by?: unknown }
  const by = typeof b.by === 'string' && b.by.trim() ? b.by.trim().slice(0, 200) : lane
  const ticket = await claimTicket(db, lane, by)
  if (!ticket) return new NextResponse(null, { status: 204, headers: NO_STORE })
  return NextResponse.json({ ticket }, { headers: NO_STORE })
}
