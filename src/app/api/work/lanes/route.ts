/**
 * @route GET /api/work/lanes
 * @entity SYSTEM
 * @description Each lane as the board draws it (a world with its lamp and the deck on its quay): lit or dry, and how
 *   many tickets wait (deck) and are held (held). No ticket's content leaves; counts only.
 *   `tick` is the orchestrator's own beat (POST /api/work/tick): when it last ran and what it did, e.g. "fired 2/2" or
 *   "fired 0/2 refused 403". beatAt and beatNote are the lane row's last write and its note (a worker heartbeat, POST /api/work/lanes/:lane/beat).
 * @permissions none
 * @example GET /api/work/lanes
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LANES } from '@/lib/work/lanes'
import { laneState, tickBeat } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ lanes: await laneState(db, LANES), tick: await tickBeat(db) }, { headers: { 'Cache-Control': 'no-store' } })
}
