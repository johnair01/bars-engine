/**
 * @route POST /api/deck/events
 * @entity SYSTEM
 * @description Log per-card landing-page analytics events (views + CTA click-throughs)
 *   so we can compare which cards / operations / domains convert. Kept deliberately
 *   simple (server-side structured log) per the card-landing spec — extend to a DB
 *   counter or Vercel Analytics event later without changing the client contract.
 * @permissions public
 * @params event:string (body, required) — one of "card_view" | "cta_click"
 * @params cardId:string (body, required) — the card slug, e.g. "WAKE-RA-SAGE"
 * @dimensions WHO:visitor, WHAT:SYSTEM, WHERE:deck funnel, ENERGY:observability
 * @agentDiscoverable false
 * @example POST /api/deck/events with {event:"card_view",cardId:"WAKE-RA-SAGE"}
 */
import { NextResponse } from 'next/server'

const KNOWN_EVENTS = new Set(['card_view', 'cta_click'])

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { event?: unknown; cardId?: unknown }
    const event = typeof body.event === 'string' ? body.event : ''
    const cardId = typeof body.cardId === 'string' ? body.cardId : ''

    if (!KNOWN_EVENTS.has(event) || !cardId) {
      return NextResponse.json({ error: 'Missing or invalid event/cardId' }, { status: 400 })
    }

    // Structured, greppable log — one line per event, keyed by card id so the deck
    // funnel can be sliced by move/operation/domain in Vercel logs. Extend to a
    // persistent counter when we need more than log-based comparison.
    console.log('[deck-card]', event, cardId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
