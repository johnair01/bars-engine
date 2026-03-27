/**
 * @route POST /api/npc-constitutions/:id/request-update
 * @entity NPC
 * @description Request a constitutional update for an NPC with proposed changes (admin-only)
 * @permissions authenticated
 * @params id:string (path, required) - NPC constitution identifier
 * @params proposedChanges:object (body, required) - Proposed changes to constitution
 * @relationships NPC (constitution mutation), DAEMON (governance)
 * @dimensions WHO:admin requester, WHAT:update proposal, WHERE:system layer, ENERGY:agent evolution
 * @example POST /api/npc-constitutions/npc123/request-update with {identity:{...}}
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { requestConstitutionUpdate } from '@/actions/npc-constitution'

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
    const body = await request.json() as Record<string, unknown>
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'proposedChanges body is required' }, { status: 400 })
    }

    const result = await requestConstitutionUpdate(id, body)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    console.error('[POST /api/npc-constitutions/:id/request-update]', e)
    return NextResponse.json({ error: 'Update request failed' }, { status: 500 })
  }
}
