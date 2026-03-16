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
