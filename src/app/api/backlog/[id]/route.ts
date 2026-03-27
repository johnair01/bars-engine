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

/**
 * @route PATCH /api/backlog/:id
 * @entity BAR
 * @description Update backlog item status or owner face (admin only)
 * @permissions admin
 * @params id:string (path, required)
 * @body status:string (optional), ownerFace:string (optional)
 * @relationships modifies SpecKitBacklogItem
 * @energyCost 0 (admin operation)
 * @dimensions WHO:admin, WHAT:BAR, WHERE:backlog
 * @example PATCH /api/backlog/item_123 {"status": "done", "ownerFace": "shaman"}
 * @agentDiscoverable true
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = (await _request.json()) as Record<string, unknown>
    const status = typeof body?.status === 'string' ? body.status : null
    const ownerFace = typeof body?.ownerFace === 'string' || body?.ownerFace === null
      ? (body.ownerFace as string | null)
      : undefined

    const data: { status?: string; ownerFace?: string | null } = {}
    if (status) data.status = status
    if (ownerFace !== undefined) data.ownerFace = ownerFace

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'status or ownerFace is required' },
        { status: 400 }
      )
    }

    const item = await db.specKitBacklogItem.update({
      where: { id },
      data,
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
