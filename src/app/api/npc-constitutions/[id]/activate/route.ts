/**
 * @route POST /api/npc-constitutions/:id/activate
 * @entity NPC
 * @description Activate an NPC constitution to begin its operational lifecycle (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - NPC constitution identifier
 * @relationships NPC (constitution state), DAEMON (activation)
 * @dimensions WHO:admin activator, WHAT:activation event, WHERE:system layer, ENERGY:agent awakening
 * @example POST /api/npc-constitutions/npc123/activate
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { activateNpcConstitution } from '@/lib/regent-gm'

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const result = await activateNpcConstitution(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }
    return NextResponse.json({ activated: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    console.error('[POST /api/npc-constitutions/:id/activate]', e)
    return NextResponse.json({ error: 'Activation failed' }, { status: 500 })
  }
}
