import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { translateTweeToFlow } from '@/lib/twee-to-flow'

const TWEE_PATH = path.join(
  process.cwd(),
  'content/twine/onboarding/bruised-banana-onboarding-draft.twee'
)

/**
 * @route GET /api/admin/onboarding/flow
 * @entity CAMPAIGN
 * @description Compile Twee draft to flow JSON for campaign execution
 * @permissions admin
 * @params none
 * @query campaign:string (bruised-banana, required)
 * @relationships DERIVED_FROM (Twee source), IMPLEMENTS (campaign flow)
 * @energyCost 0 (compile-time operation)
 * @dimensions WHO:adminId, WHAT:CAMPAIGN, WHERE:GATHERING_RESOURCES, ENERGY:none
 * @example /api/admin/onboarding/flow?campaign=bruised-banana
 * @agentDiscoverable true
 */
export async function GET(request: NextRequest) {
  const campaign = request.nextUrl.searchParams.get('campaign')
  if (!campaign || campaign !== 'bruised-banana') {
    return NextResponse.json({ error: 'Unknown campaign' }, { status: 400 })
  }

  try {
    const tweeSource = await readFile(TWEE_PATH, 'utf-8')
    const flow = translateTweeToFlow(tweeSource, {
      flowId: 'bruised-banana-onboarding-v1',
      campaignId: 'bruised_banana_residency',
    })
    return NextResponse.json(flow)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load flow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
