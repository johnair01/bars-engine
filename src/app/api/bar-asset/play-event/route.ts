/**
 * POST /api/bar-asset/play-event
 * Phase 4: Ingest play events from the game client
 *
 * Body: { playData: PlayData }
 * Returns: FeedbackLoopResult
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { processPlayEvent, type PlayData } from '@/lib/bar-asset/feedback-loop'

export async function POST(req: NextRequest) {
  const player = await getCurrentPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { playData: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.playData || typeof body.playData !== 'object') {
    return NextResponse.json({ error: 'Missing required field: playData' }, { status: 400 })
  }

  const playData = body.playData as Record<string, unknown>

  if (!playData.eventType || typeof playData.eventType !== 'string') {
    return NextResponse.json({ error: 'playData.eventType is required' }, { status: 400 })
  }
  if (!playData.sourceBarId || typeof playData.sourceBarId !== 'string') {
    return NextResponse.json({ error: 'playData.sourceBarId is required' }, { status: 400 })
  }
  if (!playData.playerId || typeof playData.playerId !== 'string') {
    return NextResponse.json({ error: 'playData.playerId is required' }, { status: 400 })
  }

  const result = await processPlayEvent(playData as unknown as PlayData, {
    creator: player.name ?? 'anonymous',
  })

  return NextResponse.json({ result }, { status: 200 })
}