import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { reviewNpcReflection } from '@/actions/npc-reflection'

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

// POST /api/npc-reflections/[id]/review — Regent approves or rejects
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reviewerId = await requireAdmin()
    const { id } = await params
    const body = await request.json() as { action?: string; notes?: string }

    if (body.action !== 'approve' && body.action !== 'reject') {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    const result = await reviewNpcReflection(id, body.action, reviewerId, body.notes)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }
    return NextResponse.json(result.reflection)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    console.error('[POST /api/npc-reflections/:id/review]', e)
    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}
