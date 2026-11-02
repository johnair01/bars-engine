/**
 * @route POST /api/work/send
 * @entity SYSTEM
 * @description Send to Claude on a harbour berth card: saves one ticket in the Claude lane (basis row `harbour:<berth>`)
 *   so the hourly pickup runs the berth's waybill. Needs no connector and no page permission.
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID)
 * @example POST /api/work/send {"berth":"fleet"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { ticketFromHarbourSend } from '@/lib/work/harbour-send'
import { pushTicket } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.nextUrl.host) return NextResponse.json({ error: 'Cross-site send' }, { status: 403 })
  const b = (await req.json().catch(() => null)) as { berth?: unknown } | null
  const draft = typeof b?.berth === 'string' ? ticketFromHarbourSend(b.berth.trim()) : null
  if (!draft) return NextResponse.json({ error: 'Expected {berth}' }, { status: 400 })
  const r = await pushTicket(db, draft)
  return NextResponse.json({ created: r.created, ticket: { id: r.ticket.id, lane: r.ticket.lane, state: r.ticket.state } },
    { status: r.created ? 201 : 200, headers: NO_STORE })
}
