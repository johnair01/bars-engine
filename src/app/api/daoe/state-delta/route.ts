/**
 * DAOE Phase 2 FR2.1: GET /api/daoe/state-delta
 *
 * Returns the current frame delta for a campaign.
 * Used by clients for reconciliation (client-side prediction protocol).
 *
 * Input:  GET /api/daoe/state-delta?campaignId={id}&frame={n}
 * Output: DeltaUpdate
 *
 * Query params:
 *   campaignId (required) — campaign UUID
 *   frame      (optional) — frame number, defaults to 0
 *   register   (optional) — override register inference ('fortune' | 'drama' | 'karma')
 *
 * JWT: Cookie-based (bars_player_id). Suspended campaigns return suspended=true.
 */

import { NextRequest, NextResponse } from 'next/server'
import { computeDelta, isSuspended } from '@/lib/daoe/delta-service'
import type { ResolutionRegister } from '@/lib/daoe/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')
  const frame = Number(searchParams.get('frame') ?? 0)
  const registerOverride = searchParams.get('register') as ResolutionRegister | null

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
  }

  // Suspended campaign — return suspended delta (Phase 4 FR4.4)
  if (await isSuspended(campaignId)) {
    return NextResponse.json(
      { campaignId, frame, register: 'none', suspended: true, serverTime: Date.now() },
      { status: 200 },
    )
  }

  try {
    const delta = await computeDelta(campaignId, frame, {
      registerOverride: registerOverride ?? undefined,
    })
    return NextResponse.json(delta, { status: 200 })
  } catch (e) {
    console.error('[daoe/state-delta]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}