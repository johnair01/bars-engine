/**
 * @route POST /api/between/farm/parcel
 * @entity PLAYER
 * @description Open a sealed seed parcel on the farm shelf: take it into the satchel, or compost it. One transaction; a second take adds nothing.
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (BetweenPrivate keys "farm-world" and "pouch" on the homeroom)
 * @example POST /api/between/farm/parcel { "id": "pcl-abc-0", "act": "take" }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer, ensureHome } from '@/lib/between/store'
import { parcelAct, worldAndSeeds } from '@/lib/between/farm-world-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to open the parcel' }, { status: 401 })
  const b = await req.json().catch(() => null) as { id?: unknown; act?: unknown } | null
  if (!b || typeof b.id !== 'string') return NextResponse.json({ error: 'Name the parcel' }, { status: 400 })
  const { home } = await ensureHome(player.id)
  if (!home) return NextResponse.json({ error: 'No homeroom yet' }, { status: 409 })
  const r = await parcelAct(fn => db.$transaction(tx => fn(tx)), home.id, player.id, b.id, b.act, new Date().toISOString())
  if (!r.ok) return NextResponse.json({ error: r.why ?? 'That did not work' }, { status: r.why === 'No such parcel' ? 404 : 400 })
  return NextResponse.json({ state: r.state, ...(await worldAndSeeds(db, home.id, player.id)) })
}
