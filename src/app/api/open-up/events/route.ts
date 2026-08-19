/**
 * @route POST /api/open-up/events
 * @entity SYSTEM
 * @description Logs aggregate Open Up Check funnel events. Private answers are
 * never accepted by this endpoint.
 * @permissions public
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

import { parseOpenUpAnalyticsEvent } from '@/lib/open-up/events'

export async function POST(request: Request) {
  try {
    const parsed = parseOpenUpAnalyticsEvent(await request.json())
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid Open Up event' }, { status: 400 })
    }

    // Structured aggregate event only. `parseOpenUpAnalyticsEvent` drops all
    // free text and unknown keys before anything reaches logs/observability.
    console.info('[open-up-check]', JSON.stringify(parsed))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
