/**
 * @route GET /between/walk
 * @entity PLAYER
 * @description The visitor's nook: the Between's homeroom with no sign-in and no store, where the walk through the four lands begins
 * @permissions public; the page reads and writes nothing in the store
 * @relationships none
 * @example GET /between/walk
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { BETWEEN_PAGE } from '@/lib/between/page'

/**
 * Six-faces-council charge-to-world, his B on ctw-walk-demo-look-1 (2026-11-04): the walk opens in a nook anyone can stand
 * in, with no store, instead of in the clearing. It is the same page as /ontology-game/between; garden.js reads the path,
 * skips the store, builds the nook and lets the map stand hold the sample's charge. Its doorway leads to
 * /between/land.html?walk=1, and the walk's last card leads back here.
 */
export const dynamic = 'force-static'

export function GET() {
  return new NextResponse(BETWEEN_PAGE.replace('<title>The Between</title>', "<title>A visitor's nook in the Between</title>"), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  })
}
