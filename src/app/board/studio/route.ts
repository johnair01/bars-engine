/**
 * @route GET /board/studio
 * @entity SYSTEM
 * @description The studio game's boat: the Clockwork Orrery's run, dock, intake and launch loop, with learning seeds read from the board's ledger (read-only)
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login. Vercel preview deployments, already behind Vercel's own login, open without it
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { loadFleet } from '@/lib/studio/fleet'
import { studioPage } from '@/lib/studio/page'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const preview = process.env.VERCEL_ENV === 'preview'
  if (!preview && !(await isBoardOwner()))
    return NextResponse.redirect(new URL('/login?returnTo=/board/studio', req.url))
  const world = await loadFleet()
  if (!world) return new NextResponse('The board ledger could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  return new NextResponse(studioPage(world), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY',
               'Referrer-Policy': 'same-origin' },
  })
}
