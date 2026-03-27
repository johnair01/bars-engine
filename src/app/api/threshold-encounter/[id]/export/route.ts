/**
 * @route GET /api/threshold-encounter/:id/export
 * @entity QUEST
 * @description Export a threshold encounter as downloadable Twee file
 * @permissions owner
 * @params id:string (path, required) - ThresholdEncounter identifier
 * @relationships QUEST (ThresholdEncounter), PLAYER (owner)
 * @dimensions WHO:playerId, WHAT:Twee export, WHERE:encounter context, ENERGY:story artifact
 * @example /api/threshold-encounter/enc123/export
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { id } = await params

  const encounter = await db.thresholdEncounter.findUnique({
    where: { id },
  })
  if (!encounter || encounter.playerId !== playerId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const filename = `threshold-encounter-${id.slice(0, 8)}.twee`
  return new NextResponse(encounter.tweeSource, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
