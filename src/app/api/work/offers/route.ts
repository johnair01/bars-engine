/**
 * @route GET /api/work/offers  ·  POST /api/work/offers {"from":"claude","to":"freebuff"}
 * @entity SYSTEM
 * @description Suggest-only lane routing (his A on `lane-routing-1`, 2026-11-16). GET lists the offers: a lane that is
 *   lit but claimed nothing in 24 hours, holding ready cards, and a live lane to take them (counts only). POST is his
 *   tap: it moves that lane's ready cards to the target. Held cards and cards placed by hand never move. Nothing moves
 *   without the POST.
 * @permissions GET none (counts only); POST COUNCIL_MENU_TOKEN or the board owner's sign-in
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { councilCaller } from '@/lib/work/lanes'
import { applyOffer, laneOffers } from '@/lib/work/offers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { offers } = await laneOffers(db)
  return NextResponse.json({ offers }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const council = councilCaller(req)
  if (!council && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { from?: unknown; to?: unknown }
  const r = await applyOffer(db, String(b.from ?? ''), String(b.to ?? ''), council ? 'offer-council' : 'offer-owner')
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ from: r.from, to: r.to, moved: r.moved }, { headers: { 'Cache-Control': 'no-store' } })
}
