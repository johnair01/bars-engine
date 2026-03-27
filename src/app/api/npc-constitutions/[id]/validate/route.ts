/**
 * @route POST /api/npc-constitutions/:id/validate
 * @entity NPC
 * @description Validate an NPC constitution against governance rules (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - NPC constitution identifier
 * @relationships NPC (constitution validation), DAEMON (governance rules)
 * @dimensions WHO:admin validator, WHAT:validation result, WHERE:system layer, ENERGY:compliance check
 * @example POST /api/npc-constitutions/npc123/validate
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { validateNpcConstitution } from '@/lib/regent-gm'

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
    const npc = await db.npcConstitution.findUnique({ where: { id } })
    if (!npc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = validateNpcConstitution({
      governedBy: npc.governedBy,
      tier: npc.tier,
      limits: npc.limits,
      reflectionPolicy: npc.reflectionPolicy,
    })

    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
  }
}
