/**
 * @route PATCH /api/spatial-maps/:id/anchors/:anchorId
 * @entity SYSTEM
 * @description Update an anchor in a spatial map (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - SpatialMap identifier
 * @params anchorId:string (path, required) - Anchor identifier
 * @params updates:object (body, required) - Partial anchor updates
 * @relationships SYSTEM (Anchor mutation)
 * @dimensions WHO:admin, WHAT:anchor update, WHERE:map room, ENERGY:map editing
 * @example PATCH /api/spatial-maps/map123/anchors/anchor456 with {label:"New Portal"}
 * @agentDiscoverable true
 */

/**
 * @route DELETE /api/spatial-maps/:id/anchors/:anchorId
 * @entity SYSTEM
 * @description Delete an anchor from a spatial map (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - SpatialMap identifier
 * @params anchorId:string (path, required) - Anchor identifier
 * @relationships SYSTEM (Anchor deletion)
 * @dimensions WHO:admin, WHAT:anchor removal, WHERE:map room, ENERGY:map cleanup
 * @example DELETE /api/spatial-maps/map123/anchors/anchor456
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { updateAnchor, deleteAnchor } from '@/actions/spatial-maps'

async function requireAdmin(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; anchorId: string }> }
) {
  try {
    await requireAdmin()
    const { anchorId } = await params
    const body = await request.json() as Record<string, unknown>
    const anchor = await updateAnchor(anchorId, body)
    return NextResponse.json(anchor)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; anchorId: string }> }
) {
  try {
    await requireAdmin()
    const { anchorId } = await params
    await deleteAnchor(anchorId)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
