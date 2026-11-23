/**
 * @route POST /api/board/gallery/call
 * @entity SYSTEM
 * @description A call for more from the Stores' empty place: writes the planned row's call to the board store (a `stores`
 *   save, docId call~<hole id>) at the row's own price. Spends at once while the Pacific month stays under the $30 cap
 *   (his A on ag-who-triggers-spend); past it the call lands held_at_cap and spends nothing. One call per hole.
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID)
 * @example POST /api/board/gallery/call {"hole":"healing-journey-homeroom.object-1"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { holeById } from '@/lib/board/gallery'
import { latestDoc, latestDocs } from '@/lib/board/store'
import { callDoc, callId, callsOf, callWords, decideCall, spentThisMonth, type CallDoc } from '@/lib/studio/gallery-call'
import type { Placement } from '@/lib/studio/stores'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.nextUrl.host) return NextResponse.json({ error: 'Cross-site call' }, { status: 403 })
  const body = await req.json().catch(() => null) as { hole?: unknown } | null
  if (!body || typeof body.hole !== 'string' || !body.hole) return NextResponse.json({ error: 'name the hole' }, { status: 400 })
  const hole = await holeById(body.hole)
  if (!hole) return NextResponse.json({ error: 'No such planned row' }, { status: 404 })
  const docId = callId(hole.id), already = await latestDoc('council', 'stores', docId) as CallDoc | null
  if (already) return NextResponse.json({ ok: true, state: already.state, again: true, words: 'This one is already called for.' }, { headers: NO_STORE })
  const now = new Date()
  const spent = spentThisMonth(callsOf(((await latestDocs('council')).stores ?? {}) as Record<string, Placement>), now)
  const state = decideCall(hole.price, spent)
  await db.boardSave.create({ data: { board: 'council', collection: 'stores', docId, recordedAt: null, record: null,
    data: callDoc(hole, state, now) as object } })
  return NextResponse.json({ ok: true, state, spent, words: callWords(state, hole.price, spent) }, { headers: NO_STORE })
}
