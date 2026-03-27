import { NextRequest, NextResponse } from 'next/server'
import { getActorGuidance } from '@/lib/simulation/guidance'
import { loadFlowBySlug } from '@/lib/simulation/flowLoader'

/**
 * @route GET /api/guidance
 * @entity QUEST
 * @description Returns simulated actor guidance for the current flow node
 * @permissions public
 * @query flowId:string (required, flow slug like bruised-banana)
 * @query nodeId:string (required, current node ID)
 * @query role:string (optional, actor role: librarian|witness|collaborator, default: librarian)
 * @query visited:string (optional, comma-separated visited nodes)
 * @query events:string (optional, comma-separated event IDs)
 * @energyCost 0 (simulation/guidance)
 * @dimensions WHO:actor_role, WHAT:QUEST, WHERE:flow_context
 * @example /api/guidance?flowId=bruised-banana&nodeId=start&role=librarian
 * @agentDiscoverable true
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const flowId = searchParams.get('flowId')
  const nodeId = searchParams.get('nodeId')
  const role = searchParams.get('role') ?? 'librarian'
  const visited = searchParams.get('visited')
  const events = searchParams.get('events')

  if (!flowId || !nodeId) {
    return NextResponse.json(
      { error: 'flowId and nodeId are required' },
      { status: 400 }
    )
  }

  const flow = loadFlowBySlug(flowId)
  if (!flow) {
    return NextResponse.json(
      { error: `Unknown flow: ${flowId}. Use: bruised-banana, campaign-intro, identity-selection, intended-impact-bar, orientation-linear, orientation-bar` },
      { status: 404 }
    )
  }

  const questState = {
    visited_nodes: visited ? visited.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    events_emitted: events ? events.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
  }

  const response = getActorGuidance({
    flow,
    current_node_id: nodeId,
    role_id: role,
    quest_state: questState,
  })

  return NextResponse.json(response)
}
