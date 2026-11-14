/**
 * @route GET /api/work/seals
 * @entity SYSTEM
 * @description The receipt seal for every card he sent (council position sr-receipt-seal): per board row, Sent,
 *   picked up, Done with its one-line result, or Waiting with why, read from the work queue. The board draws it on
 *   the card. Results can name his work, so only he (signed in) or the council's token reads them. A harbour Send has a
 *   seal too, on row `harbour:<berth>`, so the harbour can serve the next card that is not with Claude and show the
 *   sends that are stuck (`stuck`: unpicked or silent; `ahead`: older cards waiting before it in its lane).
 * @permissions the board owner's sign-in, or COUNCIL_MENU_TOKEN
 * @example GET /api/work/seals
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'
import { nextPickup, sealsFrom } from '@/lib/work/seals'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  const now = new Date()
  const since = new Date(now.getTime() - WEEK_MS)
  const [tickets, dry, ready] = await Promise.all([
    db.workTicket.findMany({
      where: { createdAt: { gt: since },
        OR: [{ sourceKey: { startsWith: 'council/questions/' } }, { sourceKey: { startsWith: 'harbour-send/' } }] },
      orderBy: { createdAt: 'desc' }, take: 300,
      select: { sourceKey: true, basis: true, lane: true, lanes: true, state: true, result: true, createdAt: true,
        updatedAt: true, doneAt: true, leaseUntil: true },
    }),
    db.workLane.findMany({ where: { dry: true }, select: { lane: true, dryUntil: true } }),
    // every ready ticket, whatever made it: the pickup claims the oldest first, so these are the cards ahead
    db.workTicket.findMany({ where: { state: 'ready' }, select: { lane: true, createdAt: true }, take: 1000 }),
  ])
  const out = dry.filter(d => !d.dryUntil || d.dryUntil > now)
  return NextResponse.json({ now: now.toISOString(), nextPickup: nextPickup(now).toISOString(), seals: sealsFrom(tickets, out, now, ready) },
    { headers: NO_STORE })
}
