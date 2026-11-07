/**
 * @route GET /between/walk/hollow
 * @entity PLAYER
 * @description The walk's last stop: the Hollow with a stand-in friend, a card drawn from her deck and one lantern carried out, with no sign-in and no store
 * @permissions public; the page reads and writes nothing in the store
 * @relationships none
 * @example GET /between/walk/hollow
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { BETWEEN_PAGE } from '@/lib/between/page'

/**
 * Six-faces-council hollow-demo, his A on hdw-route (2026-11-06): after the four lands the walk goes home to the nook and on
 * into the Hollow. It is the same page as /ontology-game/between; garden.js reads the path (VISIT_HOLLOW), skips the store and
 * opens the stand-in room with Mara, the sample player, across the low table. walk-hollow.js names each step and ends the walk.
 */
export const dynamic = 'force-static'

export function GET() {
  return new NextResponse(BETWEEN_PAGE.replace('<title>The Between</title>', '<title>The Hollow, on the walk through the Between</title>'), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  })
}
