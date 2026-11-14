/**
 * @route POST /api/work/:id/steer
 * @entity SYSTEM
 * @description Steer a ticket to another lane (fleet-altitude-look-1, his answer "a + C"): the Council Board's fleet
 *   ladder calls it when he drags a lantern onto another lane. A claimed ticket is taken from its worker and waits ready
 *   in the new lane; a failed one goes back to ready; a done one answers 409 (src/lib/work/queue.ts steerTicket).
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID) or COUNCIL_MENU_TOKEN
 * @example POST /api/work/ckx123/steer {"lane":"freebuff"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller, isLane } from '@/lib/work/lanes'
import { steerTicket } from '@/lib/work/queue'
import { wakePickupAfter } from '@/lib/work/wake'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const council = councilCaller(req)
  if (!council) {
    if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
    const origin = req.headers.get('origin')
    if (origin && new URL(origin).host !== req.nextUrl.host) return NextResponse.json({ error: 'Cross-site steer' }, { status: 403 })
  }
  const { id } = await params
  const b = (await req.json().catch(() => null)) as { lane?: unknown } | null
  if (!isLane(b?.lane)) return NextResponse.json({ error: 'Expected {lane}: claude, freebuff or deepai' }, { status: 400 })
  const r = await steerTicket(db, id, b.lane)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  if (r.moved && r.ticket.lane === 'claude' && r.ticket.state === 'ready') wakePickupAfter(r.ticket.title)
  return NextResponse.json({ moved: r.moved, ticket: { id: r.ticket.id, lane: r.ticket.lane, state: r.ticket.state } },
    { headers: NO_STORE })
}
