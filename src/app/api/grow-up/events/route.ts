/**
 * @route POST /api/grow-up/events
 * @entity SYSTEM
 * @description Logs aggregate Grow Up Check funnel events. Private answers — and
 * the reservation and boundary in particular — are never accepted by this endpoint.
 * @permissions public
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

import { parseGrowUpAnalyticsEvent } from '@/lib/grow-up/events'

export async function POST(request: Request) {
  try {
    const parsed = parseGrowUpAnalyticsEvent(await request.json())
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid Grow Up event' }, { status: 400 })
    }

    // Structured aggregate event only. `parseGrowUpAnalyticsEvent` drops all free
    // text and unknown keys before anything reaches logs/observability.
    console.info('[grow-up-check]', JSON.stringify(parsed))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
