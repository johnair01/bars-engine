/**
 * @route POST /api/work/sweep
 * @entity SYSTEM
 * @description Homeport FR-001: makes a ticket, by the same sourceKey his live save would have used, for every council
 *   question he answered and every card he sent in the last 7 days that has none (a save before tickets existed, or a
 *   push that failed). A second sweep creates nothing. `?dry=1` lists what it would make and makes nothing.
 * @permissions COUNCIL_MENU_TOKEN
 * @example POST /api/work/sweep?dry=1
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { councilCaller } from '@/lib/work/lanes'
import { sweepTickets } from '@/lib/work/sweep'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  const dry = ['1', 'true'].includes(req.nextUrl.searchParams.get('dry') ?? '')
  return NextResponse.json(await sweepTickets(db, { dry }), { headers: NO_STORE })
}
