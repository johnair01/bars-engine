/**
 * @route GET /ontology-game/between
 * @entity PLAYER
 * @description The Between: a 3D garden two people tend together, in a hollow under a great tree's roots
 * @permissions signed-in player (bars_player_id cookie); the garden itself opens only to its two members or an invite link
 * @relationships PLAYER (BetweenGarden)
 * @example GET /ontology-game/between?g=clx...&invite=...
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer } from '@/lib/between/store'
import { BETWEEN_PAGE } from '@/lib/between/page'

export const dynamic = 'force-dynamic'

/**
 * Six-faces-council bh-move-to-bars-engine (2026-10-17): the page that would not open on his iPhone inside the Claude
 * app now lives beside the caves. This route only checks the sign-in and hands out the page (src/lib/between/page.ts);
 * the scene is public/between/garden.js (the hollow and the creature in hollow.js and creature.js, round 2) and the store
 * is /api/between.
 */

export async function GET(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) {
    const back = req.nextUrl.pathname + req.nextUrl.search
    return NextResponse.redirect(new URL('/login?returnTo=' + encodeURIComponent(back), req.url))
  }
  return new NextResponse(BETWEEN_PAGE, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin' },
  })
}
