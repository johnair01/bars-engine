/**
 * @route GET /api/spatial-maps/:id/anchors
 * @entity SYSTEM
 * @description List all anchors in a spatial map (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - SpatialMap identifier
 * @relationships SYSTEM (SpatialMap, MapRoom, Anchor)
 * @dimensions WHO:admin, WHAT:anchor list, WHERE:spatial map, ENERGY:map navigation
 * @example /api/spatial-maps/map123/anchors
 * @agentDiscoverable true
 */

/**
 * @route POST /api/spatial-maps/:id/anchors
 * @entity SYSTEM
 * @description Create a new anchor in a spatial map room (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - SpatialMap identifier
 * @params roomId:string (body, required) - MapRoom identifier
 * @params anchorType:string (body, required) - Anchor type
 * @params tileX:number (body, required) - X coordinate
 * @params tileY:number (body, required) - Y coordinate
 * @params label:string (body, optional) - Anchor label
 * @params linkedId:string (body, optional) - Linked entity ID
 * @params linkedType:string (body, optional) - Linked entity type
 * @params config:string (body, optional) - Anchor configuration JSON
 * @relationships SYSTEM (SpatialMap, MapRoom, Anchor)
 * @dimensions WHO:admin creator, WHAT:anchor creation, WHERE:map room, ENERGY:map construction
 * @example POST /api/spatial-maps/map123/anchors with {roomId:"room1",anchorType:"portal",tileX:5,tileY:3}
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db, dbBase } from '@/lib/db'
import { createAnchor } from '@/actions/spatial-maps'

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const rooms = await dbBase.mapRoom.findMany({
      where: { mapId: id },
      include: { anchors: true },
    })
    const anchors = rooms.flatMap(r => r.anchors)
    return NextResponse.json(anchors)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    await params // ensure we have the mapId in scope but anchor is room-scoped
    const body = await request.json() as {
      roomId: string
      anchorType: string
      tileX: number
      tileY: number
      label?: string
      linkedId?: string
      linkedType?: string
      config?: string
    }
    const anchor = await createAnchor(body)
    return NextResponse.json(anchor)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
