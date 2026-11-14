/**
 * @route GET /api/work/fleet
 * @entity SYSTEM
 * @description Every open ticket (ready, claimed, held, failed) as a lantern at its altitude: oars (moving), ship
 *   (stalled) or fleet (blocked, needs him). The Council Board's fleet ladder reads it (src/lib/work/fleet.ts).
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID) or COUNCIL_MENU_TOKEN
 * @example GET /api/work/fleet
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { fleetFrom } from '@/lib/work/fleet'
import { councilCaller } from '@/lib/work/lanes'
import { dryLanes } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const now = new Date()
  const tickets = await db.workTicket.findMany({
    where: { state: { in: ['ready', 'claimed', 'held', 'failed'] } }, orderBy: { createdAt: 'asc' }, take: 300,
    select: { id: true, title: true, lane: true, lanes: true, state: true, result: true, leaseUntil: true,
      createdAt: true, updatedAt: true } })
  return NextResponse.json({ lanterns: fleetFrom(tickets, await dryLanes(db, now), now) }, { headers: NO_STORE })
}
