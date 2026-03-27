import { NextRequest, NextResponse } from 'next/server'
import { completeForgeSession, type CompleteForgeInput } from '@/actions/forge'

/**
 * @route POST /api/admin/forge/:id/complete
 * @entity QUEST
 * @description Complete a Forge session and route output to BAR or QUEST_SEED
 * @permissions admin
 * @params id:string (path, required) - Forge session ID
 * @query none
 * @relationships DERIVED_FROM (collapsedFromQuest), FORK_OF (optional parentBarId)
 * @energyCost variable (depends on emotional alchemy moves during session)
 * @dimensions WHO:forgerId, WHAT:QUEST, WHERE:DIRECT_ACTION, ENERGY:vibulon, PERSONAL_THROUGHPUT:stage
 * @example /api/admin/forge/forge_123/complete
 * @agentDiscoverable true
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let routing: CompleteForgeInput | undefined
    try {
      const body = (await request.json()) as CompleteForgeInput
      if (body && typeof body === 'object') routing = body
    } catch {
      // Empty body ok
    }
    const result = await completeForgeSession(id, routing)
    if ('error' in result) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to complete Forge session'
    const status = msg.includes('authenticated') ? 401 : msg.includes('Admin') || msg.includes('authorized') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
