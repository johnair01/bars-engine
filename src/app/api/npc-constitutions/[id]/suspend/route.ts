/**
 * @route POST /api/npc-constitutions/:id/suspend
 * @entity NPC
 * @description Suspend an active NPC constitution with reason (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - NPC constitution identifier
 * @params reason:string (body, optional) - Suspension reason (default: "Suspended by Regent")
 * @relationships NPC (constitution state), DAEMON (suspension)
 * @dimensions WHO:admin regent, WHAT:suspension event, WHERE:system layer, ENERGY:agent pause
 * @example POST /api/npc-constitutions/npc123/suspend with {reason:"Policy violation"}
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { suspendNpcConstitution } from '@/lib/regent-gm'

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json() as { reason?: string }
    const reason = typeof body.reason === 'string' && body.reason.trim()
      ? body.reason.trim()
      : 'Suspended by Regent'

    const result = await suspendNpcConstitution(id, reason)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }
    return NextResponse.json({ suspended: true, reason })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    console.error('[POST /api/npc-constitutions/:id/suspend]', e)
    return NextResponse.json({ error: 'Suspension failed' }, { status: 500 })
  }
}
