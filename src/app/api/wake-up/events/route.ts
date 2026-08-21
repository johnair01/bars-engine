/**
 * @route POST /api/wake-up/events
 * @entity SYSTEM
 * @description Logs aggregate Wake Up Check funnel events. Private answers are
 * never accepted by this endpoint.
 * @permissions public
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

import { parseWakeUpAnalyticsEvent } from '@/lib/wake-up/events'

export async function POST(request: Request) {
  try {
    const parsed = parseWakeUpAnalyticsEvent(await request.json())
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid Wake Up event' }, { status: 400 })
    }

    // Structured aggregate event only. `parseWakeUpAnalyticsEvent` drops all
    // free text and unknown keys before anything reaches logs/observability.
    console.info('[wake-up-check]', JSON.stringify(parsed))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
