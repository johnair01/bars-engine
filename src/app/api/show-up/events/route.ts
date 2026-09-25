/**
 * @route POST /api/show-up/events
 * @entity SYSTEM
 * @description Logs aggregate Show Up Check funnel events. The action itself is
 * self-reported and never verified; private answers are never accepted here.
 * @permissions public
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

import { parseShowUpAnalyticsEvent } from '@/lib/show-up/events'

export async function POST(request: Request) {
  try {
    const parsed = parseShowUpAnalyticsEvent(await request.json())
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid Show Up event' }, { status: 400 })
    }

    // Structured aggregate event only. `parseShowUpAnalyticsEvent` drops all free
    // text and unknown keys before anything reaches logs/observability.
    console.info('[show-up-check]', JSON.stringify(parsed))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
