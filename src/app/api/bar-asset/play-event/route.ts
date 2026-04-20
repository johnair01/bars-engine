/**
 * POST /api/bar-asset/play-event — Phase 4 feedback loop ingestion
 * Accepts play events, runs them through the feedback loop.
 * Sprint: sprint/bar-asset-pipeline-001
 */

import { NextResponse } from 'next/server'
import { processPlayEvent } from '@/lib/bar-asset/feedback-loop'
import { validatePlayData, type PlayData } from '@/lib/bar-asset/play-data'

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate structure
  const validation = validatePlayData(body)
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid play data', details: validation.errors },
      { status: 400 },
    )
  }

  const playData = body as PlayData

  // Reject abandon events (no quality signal from abandoned runs)
  if (playData.eventType === 'abandon') {
    return NextResponse.json(
      { error: 'abandon events are not accepted', code: 'ABANDON_REJECTED' },
      { status: 400 },
    )
  }

  // Process through feedback loop
  const result = await processPlayEvent(playData)

  if (result.skipped) {
    return NextResponse.json(
      { accepted: false, reason: result.skipReason },
      { status: 200 },
    )
  }

  return NextResponse.json({
    accepted: true,
    barSeedId: result.barSeedId,
    barAssetUpdated: result.barAssetUpdated,
  })
}