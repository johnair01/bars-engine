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
