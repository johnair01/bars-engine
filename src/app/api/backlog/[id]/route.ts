import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await _request.json()
    const status = typeof body === 'object' && body !== null && 'status' in body
      ? String(body.status)
      : null
    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }
    const item = await db.specKitBacklogItem.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(item)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    console.error('[PATCH /api/backlog/:id]', e)
    return NextResponse.json(
      { error: 'Failed to update backlog item' },
      { status: 500 }
    )
  }
}
