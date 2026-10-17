/**
 * @route POST /api/between/:gardenId/poll
 * @entity PLAYER
 * @description The garden as it stands and who is in it now; records where the caller stands (polling, bh-async-first)
 * @permissions a member of the garden, or a signed-in player holding its invite token (sees the spark only)
 * @relationships PLAYER (BetweenGarden, BetweenPresence)
 * @example POST /api/between/clx.../poll { "presence": { "x": 1.2, "z": 3.1, "h": 3.14, "w": false } }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer, setPresence, snapshot, whoIs } from '@/lib/between/store'
import type { Doc } from '@/lib/between/rules'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await params
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to open the garden' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { presence?: Doc; invite?: string }
  const found = await whoIs(gardenId, player.id, body.invite)
  if (!found) return NextResponse.json({ error: 'There is no garden here' }, { status: 404 })
  const { who } = found
  if (!who.member && !who.invited) return NextResponse.json({ error: 'Only the two people in this garden can open it' }, { status: 403 })
  if (body.presence && typeof body.presence === 'object') await setPresence(gardenId, player.id, body.presence)
  const snap = await snapshot(gardenId, who)
  return NextResponse.json({ me: player.id, ...snap }, { headers: { 'Cache-Control': 'no-store' } })
}
