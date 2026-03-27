import { NextRequest, NextResponse } from 'next/server'
import { isCampaignRefSlug } from '@/lib/narrative-os/campaign-overlays'
import { isSpaceId } from '@/lib/narrative-os/types'
import type { CampaignSeedResponse } from '@/lib/narrative-os/types'

/**
 * POST /api/campaigns/:campaignId/seed/:space
 * Mock: accepts seed intent; no persistence (Phase 4).
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ campaignId: string; space: string }> }
) {
  const { campaignId, space } = await context.params
  if (!isCampaignRefSlug(campaignId)) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 })
  }
  if (!isSpaceId(space)) {
    return NextResponse.json({ error: 'space must be library | dojo | forest | forge' }, { status: 400 })
  }

  const body: CampaignSeedResponse = {
    ok: true,
    campaignId,
    space,
    message:
      'Mock seed recorded (no database write in v0). Use GET /api/campaigns/:campaignId/overlays for fixture overlays.',
    token: `mock-seed-${campaignId}-${space}-${Date.now()}`,
  }
  return NextResponse.json(body, { status: 200 })
}
