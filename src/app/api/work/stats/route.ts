/**
 * @route GET /api/work/stats
 * @entity SYSTEM
 * @description What each lane finished and how hard it found the work: done count in the window, median and max
 *   attempts, median hours from queued to done, and the share of done tickets that carry a link a person can open.
 *   Two lanes on the same model are measured the same way here, so comparing environments is a read and not an
 *   impression. The judgement stays his; this is the evidence a quality note argues from.
 * @permissions COUNCIL_MENU_TOKEN
 * @example GET /api/work/stats?days=30
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { councilCaller } from '@/lib/work/lanes'
import { laneStats } from '@/lib/work/stats'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  const n = Number(req.nextUrl.searchParams.get('days') ?? '30')
  const days = Number.isFinite(n) && n > 0 ? Math.min(n, 365) : 30
  return NextResponse.json(await laneStats(db, days), { headers: NO_STORE })
}
