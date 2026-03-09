import { NextRequest, NextResponse } from 'next/server'
import { getActorGuidance } from '@/lib/simulation/guidance'
import { loadFlowBySlug } from '@/lib/simulation/flowLoader'

/**
 * GET /api/guidance?flowId=...&nodeId=...&role=librarian
 *
 * Returns simulated actor guidance for the current flow node.
 * Optional: visited, events (comma-separated) for richer Witness/Collaborator responses.
 *
 * Flow slugs: bruised-banana, campaign-intro, identity-selection, intended-impact-bar,
 *             orientation-linear, orientation-bar
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
