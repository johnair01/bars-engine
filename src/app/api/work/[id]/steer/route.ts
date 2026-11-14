/**
 * @route POST /api/work/:id/steer
 * @entity SYSTEM
 * @description Steer a ticket to another lane, or hold it back. The write lands in the store at once: the harbour page's
 *   lantern drag and the board MCP server's `steer_ticket` tool both come here (src/lib/work/queue.ts steerTicket). Only
 *   a ready or held ticket can be steered; a claimed ticket is its crew's until it releases it. A steer to a lane
 *   resets the ticket's lease and puts the lane first in the ticket's order.
 * @permissions COUNCIL_MENU_TOKEN, or the board owner's sign-in
 * @example POST /api/work/ckx123/steer {"lane":"freebuff"}   (or {"lane":"hold"})
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'
import { steerTicket } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const council = councilCaller(req)
  if (!council && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { lane?: unknown }
  const r = await steerTicket(db, id, typeof b.lane === 'string' ? b.lane : '', council ? 'council' : 'owner')
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ticket: { id: r.ticket.id, state: r.ticket.state, lane: r.ticket.lane, lanes: r.ticket.lanes } },
    { headers: { 'Cache-Control': 'no-store' } })
}
