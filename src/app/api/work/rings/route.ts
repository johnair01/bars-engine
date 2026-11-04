/**
 * @route GET /api/work/rings
 * @entity SYSTEM
 * @description Homeport FR-006: the rings the crews earned, one per voyage that came home whole (a plain yes on its
 *   first look, or no look and nothing reopened in 7 days), as {row, doneAt, look}. The page groups them by ship and
 *   draws hoops; it never shows the list, a number or a tally. A ring is never removed.
 * @permissions the board owner's sign-in, or COUNCIL_MENU_TOKEN
 * @example GET /api/work/rings
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'
import { ringsRead } from '@/lib/work/rings'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  return NextResponse.json(await ringsRead(db), { headers: NO_STORE })
}
