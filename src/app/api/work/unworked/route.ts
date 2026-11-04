/**
 * @route GET /api/work/unworked
 * @entity SYSTEM
 * @description Homeport FR-002: every council answer (and card sent) saved more than `minutes` ago, in the last 7 days,
 *   whose ticket is missing, ready or waiting, with why: no ticket, not picked, lane dry, worker gave up. A claimed or
 *   done ticket counts as a crew on it. The pickup and the gate routine read this instead of main's due.json.
 * @permissions COUNCIL_MENU_TOKEN
 * @example GET /api/work/unworked?minutes=1440
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { councilCaller } from '@/lib/work/lanes'
import { unworkedRead } from '@/lib/work/unworked'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  const n = Number(req.nextUrl.searchParams.get('minutes') ?? '20')
  const minutes = Number.isFinite(n) && n >= 0 ? Math.min(n, 7 * 24 * 60) : 20
  return NextResponse.json(await unworkedRead(db, minutes), { headers: NO_STORE })
}
