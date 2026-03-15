import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { executeNpcAction } from '@/actions/npc-actions'

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

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json() as {
      npcId?: string
      verb?: string
      payload?: Record<string, unknown>
      sceneId?: string
      requiresRegentApproval?: boolean
    }

    if (!body.npcId || !body.verb) {
      return NextResponse.json({ error: 'npcId and verb are required' }, { status: 400 })
    }

    const result = await executeNpcAction(
      body.npcId,
      body.verb,
      body.payload ?? {},
      { sceneId: body.sceneId, requiresRegentApproval: body.requiresRegentApproval }
    )

    if ('error' in result) {
      return NextResponse.json({ error: result.error, action: result.action }, { status: 422 })
    }

    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    console.error('[POST /api/npc-actions/execute]', e)
    return NextResponse.json({ error: 'Action execution failed' }, { status: 500 })
  }
}
