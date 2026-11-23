/**
 * @route POST /api/work/lanes/:lane/beat
 * @entity SYSTEM
 * @description A worker's heartbeat: it writes a one-line note and the time on the lane's row, and touches nothing
 *   else (the lamp and the deck stay as they are). The Zo tick calls it at the end of every tick, "tick 11:40 ok" or
 *   "tick 11:40 FAILED at <step>: <error>", so a tick that has died shows as an old beatAt on GET /api/work/lanes.
 * @permissions the lane's own token, COUNCIL_MENU_TOKEN, or the board owner's sign-in
 * @example POST /api/work/lanes/zo/beat {"note":"tick 11:40 ok"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { isLane, laneCaller, LANES } from '@/lib/work/lanes'
import { beatLane } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ lane: string }> }) {
  const { lane } = await params
  if (!isLane(lane)) return NextResponse.json({ error: `lane must be one of ${LANES.join(', ')}` }, { status: 404 })
  if (!laneCaller(req, lane) && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { note?: unknown }
  const note = typeof b.note === 'string' ? b.note.trim().slice(0, 300) : ''
  if (!note) return NextResponse.json({ error: 'Expected {note}' }, { status: 400 })
  return NextResponse.json(await beatLane(db, lane, note), { headers: { 'Cache-Control': 'no-store' } })
}
