/**
 * @route POST /api/work/tickets
 * @entity SYSTEM
 * @description The council pushes a piece of work into the lanes (a gate, a brief) without his answer passing
 *   through the board save first. A second push with the same sourceKey is a no-op. His board answers push their own
 *   tickets as they are saved (src/app/api/board/saves).
 * @permissions COUNCIL_MENU_TOKEN
 * @example POST /api/work/tickets {"sourceKey":"council/gates/wq-look-3@A","title":"...","brief":"...","basis":{"rows":["wq-look-3"]},"lanes":["claude","freebuff"]}
 *
 * @route GET /api/work/tickets
 * @description The tickets of one lane or all, newest first (up to 50), for a session checking what is queued.
 * @permissions COUNCIL_MENU_TOKEN
 * @example GET /api/work/tickets?lane=claude&state=ready
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cleanLanes, councilCaller } from '@/lib/work/lanes'
import { pushTicket } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const str = (k: string, max: number) => (typeof b?.[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '')
  const sourceKey = str('sourceKey', 300), title = str('title', 200), brief = str('brief', 20000)
  if (!sourceKey || !title || !brief) return NextResponse.json({ error: 'Expected {sourceKey, title, brief, basis?, lanes?}' }, { status: 400 })
  const basis = b?.basis && typeof b.basis === 'object' ? b.basis : {}
  const r = await pushTicket(db, { sourceKey, title, brief, basis: basis as never, lanes: cleanLanes(b?.lanes) })
  return NextResponse.json({ created: r.created, ticket: { id: r.ticket.id, lane: r.ticket.lane, state: r.ticket.state } },
    { status: r.created ? 201 : 200, headers: NO_STORE })
}

export async function GET(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const lane = req.nextUrl.searchParams.get('lane') || undefined
  const state = req.nextUrl.searchParams.get('state') || undefined
  const tickets = await db.workTicket.findMany({ where: { lane, state }, orderBy: { createdAt: 'desc' }, take: 50,
    select: { id: true, title: true, lane: true, lanes: true, state: true, claimedBy: true, leaseUntil: true,
      attempts: true, result: true, createdAt: true, basis: true } })
  return NextResponse.json({ tickets }, { headers: NO_STORE })
}
