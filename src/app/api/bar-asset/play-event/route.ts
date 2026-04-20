import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { processPlayEvent } from '@/lib/bar-asset/feedback-loop'
import type { FeedbackLoopResult } from '@/lib/bar-asset/feedback-loop'

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

  if (!body.playData) {
    return NextResponse.json({ error: 'Missing required field: playData' }, { status: 400 })
  }

  try {
    const result: FeedbackLoopResult = await processPlayEvent(body.playData as any)
    return NextResponse.json({
      accepted: true,
      barAssetId: result.barAssetId,
      persisted: result.persisted,
      skipped: result.skipped,
      skipReason: result.skipReason ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/bar-asset/play-event]', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
