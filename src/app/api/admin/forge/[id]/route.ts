import { NextRequest, NextResponse } from 'next/server'
import { advanceForgeSession } from '@/actions/forge'

/**
 * @route PATCH /api/admin/forge/:id
 * @entity QUEST
 * @description Advance a Forge session through emotional alchemy moves
 * @permissions admin
 * @params id:string (path, required) - Forge session ID
 * @query none
 * @relationships CONTAINS (forge moves), DERIVED_FROM (initial seed)
 * @energyCost variable (emotional energy metabolized during move)
 * @dimensions WHO:forgerId, WHAT:QUEST, WHERE:DIRECT_ACTION, ENERGY:vibulon, PERSONAL_THROUGHPUT:stage
 * @example /api/admin/forge/forge_123
 * @agentDiscoverable true
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as Record<string, unknown>
    const result = await advanceForgeSession(id, body as Parameters<typeof advanceForgeSession>[1])
    if ('error' in result) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to advance Forge session'
    const status = msg.includes('authenticated') ? 401 : msg.includes('Admin') || msg.includes('authorized') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
