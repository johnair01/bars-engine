/**
 * @route GET /api/work/lanes
 * @entity SYSTEM
 * @description Each lane as the board draws it (a world with its lamp and the deck on its quay): lit or dry, and how
 *   many tickets wait (deck) and are held (held). No ticket's content leaves; counts only.
 * @permissions none
 * @example GET /api/work/lanes
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LANES } from '@/lib/work/lanes'
import { laneState } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ lanes: await laneState(db, LANES) }, { headers: { 'Cache-Control': 'no-store' } })
}
