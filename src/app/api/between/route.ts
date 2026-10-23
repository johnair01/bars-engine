/**
 * @route GET /api/between
 * @entity PLAYER
 * @description The signed-in player's homeroom (made on the first call) and the rooms they tend, newest first, each with what it waits on
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (BetweenMember)
 * @example GET /api/between
 * @agentDiscoverable false
 *
 * @route POST /api/between
 * @description Plants a new spark: the setup sheet's answers become a garden the player alone tends until someone joins
 * @permissions signed-in player (bars_player_id cookie)
 * @example POST /api/between { "data": { "setup": { "who": "...", "kind": "Friendship", "hopes": "..." } } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer, ensureHome, plant } from '@/lib/between/store'
import { plantedGarden, type Doc } from '@/lib/between/rules'

export const dynamic = 'force-dynamic'

export async function GET() {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to open the garden' }, { status: 401 })
  const { home, gardens } = await ensureHome(player.id)
  return NextResponse.json({ me: player.id, name: player.name, home, gardens })
}

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to plant a spark' }, { status: 401 })
  const body = await req.json().catch(() => null) as { data?: Doc } | null
  const data = body && body.data && typeof body.data === 'object' ? plantedGarden(player.id, body.data) : null
  if (!data) return NextResponse.json({ error: 'Name who the spark is toward' }, { status: 400 })
  const { id } = await plant(player.id, data)
  return NextResponse.json({ id, doc: data })
}
