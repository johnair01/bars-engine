/**
 * DAOE Phase 4 FR4.3: POST /api/daoe/campaign-restore
 *
 * Re-subscription handler — clears suspension state, restores full access.
 * Called by the subscription service webhook when a subscription is reactivated.
 *
 * Input:  POST { campaignId: string }
 * Output: { restored: true, suspendedAt: null }
 *
 * JWT: Uses a service-level bearer token (not player cookie).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SERVICE_TOKEN = process.env.DAOE_SERVICE_TOKEN

function isAuthorized(request: NextRequest): boolean {
  if (!SERVICE_TOKEN) {
    return process.env.NODE_ENV === 'development'
  }
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${SERVICE_TOKEN}`
}

export async function POST(request: NextRequest) {
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

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, suspendedAt: true },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const wasSuspended = !!campaign.suspendedAt

  try {
    await db.campaign.update({
      where: { id: campaignId },
      data: { suspendedAt: null },
    })
  } catch (e) {
    console.error('[daoe/campaign-restore]', e)
    return NextResponse.json({ error: 'Failed to restore campaign' }, { status: 500 })
  }

  return NextResponse.json(
    {
      restored: true,
      suspendedAt: null,
      wasSuspended,
    },
    { status: 200 },
  )
}
