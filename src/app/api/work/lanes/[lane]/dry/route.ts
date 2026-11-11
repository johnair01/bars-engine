/**
 * @route POST /api/work/lanes/:lane/dry
 * @entity SYSTEM
 * @description A lane's lamp goes out (dry: true, the default) or comes back on (dry: false). A worker that hits its
 *   usage limit calls it, and he can tap the lamp from the board (`wq-dry`: both). Going dry passes the lane's ready
 *   tickets to the next lit lane in each ticket's order; the lamp relights by itself after five hours.
 * @permissions the lane's own token, COUNCIL_MENU_TOKEN, or the board owner's sign-in
 * @example POST /api/work/lanes/claude/dry {"note":"usage limit","until":"2026-11-12T18:00:00Z"}
 *   (`until` sets the renewal gate by hand; without it the lamp relights five hours after the tap, and never later
 *   than seven days out)
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { isLane, laneCaller, LANES } from '@/lib/work/lanes'
import { setLaneDry } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ lane: string }> }) {
  const { lane } = await params
  if (!isLane(lane)) return NextResponse.json({ error: `lane must be one of ${LANES.join(', ')}` }, { status: 404 })
  if (!laneCaller(req, lane) && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { dry?: unknown; note?: unknown; until?: unknown }
  // `until` is the renewal gate: the moment the lamp comes back on. Omit it and the lamp renews in five hours.
  const until = typeof b.until === 'string' && !Number.isNaN(Date.parse(b.until)) ? new Date(b.until) : null
  const r = await setLaneDry(db, lane, b.dry !== false, typeof b.note === 'string' ? b.note.slice(0, 300) : null,
                             new Date(), until)
  return NextResponse.json(r, { headers: { 'Cache-Control': 'no-store' } })
}
