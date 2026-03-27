/**
 * @route GET /api/npc-constitutions/:id
 * @entity NPC
 * @description Retrieve a specific NPC constitution by ID (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - NPC constitution identifier
 * @relationships NPC (constitution definition)
 * @dimensions WHO:admin, WHAT:NPC constitution, WHERE:system layer, ENERGY:agent inspection
 * @example /api/npc-constitutions/npc123
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getNpcConstitution } from '@/actions/npc-constitution'

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
    const npc = await getNpcConstitution(id)
    if (!npc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(npc)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to get NPC constitution' }, { status: 500 })
  }
}
