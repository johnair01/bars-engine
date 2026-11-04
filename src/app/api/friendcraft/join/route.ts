/**
 * @route POST /api/friendcraft/join
 * @entity PLAYER
 * @description Enrols the signed-in player in Friendcraft through a Friendcraft steward's spark invitation link (slice 1 of the onboarding)
 * @permissions signed-in player (bars_player_id cookie) holding a live invitation token whose spark was started by a Friendcraft steward
 * @relationships PLAYER (InstanceMembership on the friendcraft instance), BetweenGarden (the spark whose token is the key)
 * @example POST /api/friendcraft/join { "room": "clx...", "invite": "..." }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer, joinFriendcraft } from '@/lib/between/store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to open the garden' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { room?: string; invite?: string }
  const games = await joinFriendcraft(player.id, body.room, body.invite)
  if (!games) return NextResponse.json({ error: 'This link does not open Friendcraft.' }, { status: 403 })
  return NextResponse.json({ games }, { headers: { 'Cache-Control': 'no-store' } })
}
