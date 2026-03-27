import { NextRequest, NextResponse } from 'next/server'
import { isCampaignRefSlug, listCampaignOverlays } from '@/lib/narrative-os/campaign-overlays'

/**
 * GET /api/campaigns/:campaignId/overlays
 * Returns mock overlay rows for Narrative OS spaces (Phase 4).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await context.params
  if (!isCampaignRefSlug(campaignId)) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 })
  }
  const overlays = listCampaignOverlays(campaignId)
  return NextResponse.json({ campaignId, overlays })
}
