/**
 * @route POST /api/clean-up/events
 * @entity SYSTEM
 * @description Logs aggregate Clean Up Check funnel events. Private answers are
 * never accepted by this endpoint.
 * @permissions public
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

import { parseCleanUpAnalyticsEvent } from '@/lib/clean-up/events'

export async function POST(request: Request) {
  try {
    const parsed = parseCleanUpAnalyticsEvent(await request.json())
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid Clean Up event' }, { status: 400 })
    }

    // Structured aggregate event only. `parseCleanUpAnalyticsEvent` drops all
    // free text and unknown keys before anything reaches logs/observability.
    console.info('[clean-up-check]', JSON.stringify(parsed))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
