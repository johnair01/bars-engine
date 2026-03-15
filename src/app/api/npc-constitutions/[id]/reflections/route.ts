import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { generateNpcReflection, getApprovedReflections } from '@/actions/npc-reflection'

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

// GET /api/npc-constitutions/[id]/reflections — list approved reflections
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    if (status && status !== 'approved') {
      // Return all reflections for admin queue view
      const all = await db.npcReflection.findMany({
        where: { npcId: id, ...(status ? { status } : {}) },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(all)
    }

    const reflections = await getApprovedReflections(id)
    return NextResponse.json(reflections)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to list reflections' }, { status: 500 })
  }
}

// POST /api/npc-constitutions/[id]/reflections — generate new reflection (pending)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json() as {
      inputSummary?: string
      outputs?: { stance_update?: string; possible_hooks?: string[]; bar_affinity_shift?: string[] }
      campaignId?: string
    }

    if (!body.inputSummary) {
      return NextResponse.json({ error: 'inputSummary is required' }, { status: 400 })
    }

    const result = await generateNpcReflection(id, body.inputSummary, body.outputs ?? {}, body.campaignId)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }
    return NextResponse.json(result.reflection, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    console.error('[POST /api/npc-constitutions/:id/reflections]', e)
    return NextResponse.json({ error: 'Failed to generate reflection' }, { status: 500 })
  }
}
