/**
 * @route POST /api/bars/{id}/send-to-farm
 * @entity BAR
 * @description Sends a BAR the signed-in player made to their farm as a seed (BAR-to-work, slice one). The player must
 *   already have a farm and a character. The seed is sorted into one of eight work types by fixed rules, kept in the
 *   farm's seeds list, and a ticket (sourceKey bar/<id>) asks Claude for its spec. Sending twice is a no-op.
 * @permissions signed-in player (bars_player_id cookie), the BAR's maker
 * @relationships BAR (CustomBar), PLAYER (BetweenPrivate "seeds"), WorkTicket
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { currentPlayer } from '@/lib/between/store'
import { sendToFarm } from '@/lib/bar-to-work/seeds'
import { WORK_TYPE_LABEL } from '@/lib/bar-to-work/sort'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to send a BAR to your farm.' }, { status: 401 })
  const { id } = await ctx.params
  const r = await sendToFarm(player.id, id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ seed: r.seed, created: r.created, workTypeLabel: WORK_TYPE_LABEL[r.seed.workType] }, { status: r.created ? 201 : 200 })
}
