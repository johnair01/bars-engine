/**
 * @route POST /api/work/tick
 * @entity SYSTEM
 * @description The orchestrator's tick: when Claude-lane tickets are ready, a worker slot is free and the cooldown is
 *   closed, starts up to two worker sessions through the worker routine's API trigger. `?dry=1` says what it would do.
 *   Called by Vercel cron (Authorization: Bearer CRON_SECRET), the hourly pickup routine, or any council session.
 * @permissions COUNCIL_MENU_TOKEN or CRON_SECRET
 * @example POST /api/work/tick?dry=1
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { councilCaller } from '@/lib/work/lanes'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { tick } from '@/lib/work/tick'

export const dynamic = 'force-dynamic'
export const maxDuration = 30
const NO_STORE = { 'Cache-Control': 'no-store' }

async function run(req: NextRequest) {
  const cron = process.env.CRON_SECRET
  if (!councilCaller(req) && !(cron && tokenMatches(givenToken(req), cron))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  }
  const dry = ['1', 'true'].includes(req.nextUrl.searchParams.get('dry') ?? '')
  return NextResponse.json(await tick(db, { dry }), { headers: NO_STORE })
}
export const POST = run
export const GET = run // Vercel cron calls GET
