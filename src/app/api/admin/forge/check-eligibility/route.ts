import { NextRequest, NextResponse } from 'next/server'
import { checkForgeEligibility } from '@/actions/forge'

/**
 * @route POST /api/admin/forge/check-eligibility
 * @entity PLAYER
 * @description Check if player meets requirements to start a Forge session
 * @permissions admin
 * @params none
 * @query none
 * @relationships VALIDATES (player vibulon threshold), SUPPORTS (forge session start)
 * @energyCost 0 (read-only check)
 * @dimensions WHO:playerId, WHAT:PLAYER, WHERE:DIRECT_ACTION, ENERGY:vibulon
 * @example /api/admin/forge/check-eligibility
 * @agentDiscoverable true
 */
export async function POST(request: NextRequest) {
  try {
    let body: { distortionIntensity?: number } = {}
    try {
      body = (await request.json()) as typeof body
    } catch {
      // Empty body is ok
    }
    const result = await checkForgeEligibility(body.distortionIntensity)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forge eligibility check failed'
    const status = msg.includes('authenticated') ? 401 : msg.includes('Admin') || msg.includes('authorized') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
