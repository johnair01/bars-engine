/**
 * DAOE Phase 4 FR4.2: POST /api/daoe/campaign-suspend
 *
 * Subscription revocation handler — sets campaign to suspended state.
 * Called by the subscription service webhook when a payment fails or subscription ends.
 *
 * Input:  POST { campaignId: string, revokedToken?: string }
 * Output: { suspended: true, suspendedAt: string, gracePeriodEnded: boolean }
 *
 * JWT: Uses a service-level bearer token (not player cookie).
 * The subscription service calls this endpoint with its own service token.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Service token for subscription service webhook auth
const SERVICE_TOKEN = process.env.DAOE_SERVICE_TOKEN

function isAuthorized(request: NextRequest): boolean {
  if (!SERVICE_TOKEN) {
    // If no service token configured, allow in development only
    return process.env.NODE_ENV === 'development'
  }
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${SERVICE_TOKEN}`
}

export async function POST(request: NextRequest) {
  // Service-level auth
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: Record<string, unknown>
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const campaignId = typeof json.campaignId === 'string' ? json.campaignId : ''

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
  }

  // Check campaign exists
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, suspendedAt: true },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const alreadySuspended = !!campaign.suspendedAt
  const now = new Date()
  const gracePeriodEnded = true // DAOE spec: 5s propagation is acceptable; no grace period

  try {
    await db.campaign.update({
      where: { id: campaignId },
      data: { suspendedAt: now },
    })
  } catch (e) {
    console.error('[daoe/campaign-suspend]', e)
    return NextResponse.json({ error: 'Failed to suspend campaign' }, { status: 500 })
  }

  return NextResponse.json(
    {
      suspended: true,
      suspendedAt: now.toISOString(),
      // Always true — DAOE spec does not implement a grace period
      gracePeriodEnded,
      wasAlreadySuspended: alreadySuspended,
    },
    { status: 200 },
  )
}
