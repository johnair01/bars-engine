import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { createNpcConstitution, listNpcConstitutions } from '@/actions/npc-constitution'

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

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const tierParam = searchParams.get('tier')
    const tier = tierParam ? parseInt(tierParam) : undefined
    const npcs = await listNpcConstitutions({ status, tier })
    return NextResponse.json(npcs)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to list NPC constitutions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json() as Record<string, unknown>
    const required = ['name', 'archetypalRole', 'identity', 'values', 'function', 'limits', 'memoryPolicy', 'reflectionPolicy']
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
    const npc = await createNpcConstitution({
      name: body.name as string,
      archetypalRole: body.archetypalRole as string,
      tier: typeof body.tier === 'number' ? body.tier : 1,
      identity: body.identity as object,
      values: body.values as object,
      function: body.function as object,
      limits: body.limits as object,
      memoryPolicy: body.memoryPolicy as object,
      reflectionPolicy: body.reflectionPolicy as object,
    })
    return NextResponse.json(npc, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Not logged in' || msg === 'Admin access required') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    console.error('[POST /api/npc-constitutions]', e)
    return NextResponse.json({ error: 'Failed to create NPC constitution' }, { status: 500 })
  }
}
