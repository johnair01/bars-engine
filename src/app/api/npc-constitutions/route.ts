/**
 * @route GET /api/npc-constitutions
 * @entity NPC
 * @description List NPC constitutions with optional filters for status and tier
 * @permissions authenticated
 * @query status:string (optional) - Filter by constitution status
 * @query tier:number (optional) - Filter by NPC tier
 * @relationships NPC (constitution definitions), DAEMON (archetypal roles)
 * @dimensions WHO:admin, WHAT:NPC constitution, WHERE:system layer, ENERGY:agent capacity
 * @example /api/npc-constitutions?status=active&tier=2
 * @agentDiscoverable true
 */

/**
 * @route POST /api/npc-constitutions
 * @entity NPC
 * @description Create a new NPC constitution defining identity, values, function, limits, and policies
 * @permissions authenticated
 * @params name:string (body, required) - NPC name
 * @params archetypalRole:string (body, required) - NPC archetypal role
 * @params tier:number (body, optional) - NPC tier level (default: 1)
 * @params identity:object (body, required) - Identity configuration
 * @params values:object (body, required) - Core values
 * @params function:object (body, required) - Functional purpose
 * @params limits:object (body, required) - Operational boundaries
 * @params memoryPolicy:object (body, required) - Memory retention rules
 * @params reflectionPolicy:object (body, required) - Self-reflection rules
 * @relationships NPC (provenance), DAEMON (archetypal role)
 * @dimensions WHO:admin creator, WHAT:NPC constitution, WHERE:system layer, ENERGY:agent initialization
 * @example POST /api/npc-constitutions with full constitution object
 * @agentDiscoverable true
 */
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
