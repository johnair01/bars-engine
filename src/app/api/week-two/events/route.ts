/**
 * @route POST /api/week-two/events
 * @entity SYSTEM
 * @description Logs aggregate Week 2 (Skillful Organizing) funnel events.
 * Private course reflections are never accepted by this endpoint.
 * @permissions public
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

import { parseRoundTwoAnalyticsEvent } from '@/lib/mtgoa-course/round-two-events'

export async function POST(request: Request) {
  try {
    const parsed = parseRoundTwoAnalyticsEvent(await request.json())
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid Week 2 event' }, { status: 400 })
    }

    console.info('[week-two]', JSON.stringify(parsed))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
