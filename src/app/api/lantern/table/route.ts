/**
 * @route GET /api/lantern/table
 * @entity PLAYER
 * @description The signed-in player's newest Lantern Hall table: its id and the intake it was dealt from
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (LanternTable)
 * @example GET /api/lantern/table
 * @agentDiscoverable false
 *
 * @route POST /api/lantern/table
 * @description Deals a table from an intake in the reel's intake/game shape, or saves the intake again on the player's own table when id is given
 * @permissions signed-in player (bars_player_id cookie)
 * @example POST /api/lantern/table { "intake": { "goal": "Make one ask today", "want": ["fire"], "now": { "water": 2 }, "truth": { "water": true }, "truthCtx": {}, "res": [true, true, true, true, true, true], "tags": [{}, {}, {}, {}, {}, {}] } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer } from '@/lib/between/store'
import { dealTable, latestTable, postgresStore } from '@/lib/lantern/pg-store'
import { parseIntake } from '@/lib/lantern/store'

export const dynamic = 'force-dynamic'

const SIGN_IN = { error: 'Sign in to keep your table' }

export async function GET() {
  const player = await currentPlayer()
  if (!player) return NextResponse.json(SIGN_IN, { status: 401 })
  return NextResponse.json({ table: await latestTable(player.id) })
}

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json(SIGN_IN, { status: 401 })
  const body = (await req.json().catch(() => null)) as { id?: unknown; intake?: unknown } | null
  const intake = parseIntake(body?.intake)
  if (!intake) return NextResponse.json({ error: 'The intake needs a goal and six reservations' }, { status: 400 })
  if (typeof body?.id === 'string' && body.id) {
    try {
      await postgresStore(player.id).saveIntake(body.id, intake)
      return NextResponse.json({ id: body.id })
    } catch {
      return NextResponse.json({ error: 'That table is not yours' }, { status: 404 })
    }
  }
  const id = await dealTable(player.id, intake)
  return NextResponse.json({ id })
}
