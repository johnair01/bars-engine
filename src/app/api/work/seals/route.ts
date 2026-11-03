/**
 * @route GET /api/work/seals
 * @entity SYSTEM
 * @description The receipt seal for every card he sent (council position sr-receipt-seal): per board row, Sent,
 *   picked up, Done with its one-line result, or Waiting with why, read from the work queue. The board draws it on
 *   the card. Results can name his work, so only he (signed in) or the council's token reads them.
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
  const [tickets, dry] = await Promise.all([
    db.workTicket.findMany({
      where: { sourceKey: { startsWith: 'council/questions/' }, createdAt: { gt: new Date(now.getTime() - WEEK_MS) } },
      orderBy: { createdAt: 'desc' }, take: 200,
      select: { sourceKey: true, basis: true, lane: true, lanes: true, state: true, result: true, createdAt: true,
        updatedAt: true, doneAt: true },
    }),
    db.workLane.findMany({ where: { dry: true }, select: { lane: true, dryUntil: true } }),
  ])
  const out = dry.filter(d => !d.dryUntil || d.dryUntil > now)
  return NextResponse.json({ now: now.toISOString(), nextPickup: nextPickup(now).toISOString(), seals: sealsFrom(tickets, out, now) },
    { headers: NO_STORE })
}
