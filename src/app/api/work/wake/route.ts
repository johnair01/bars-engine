/**
 * @route GET /api/work/wake
 * @entity SYSTEM
 * @description Says whether an answer can start the pickup routine now: whether PICKUP_ROUTINE_FIRE_URL and
 *   PICKUP_ROUTINE_TOKEN are set in this deployment, which routine the URL names, and what the last wake on this server
 *   instance did. Never returns the token or the URL.
 * @permissions COUNCIL_MENU_TOKEN or the board owner's sign-in
 * @example GET /api/work/wake
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'
import { wakeStatus } from '@/lib/work/wake'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  return NextResponse.json(wakeStatus(), { headers: NO_STORE })
}
