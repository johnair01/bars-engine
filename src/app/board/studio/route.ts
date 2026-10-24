/**
 * @route GET /board/studio
 * @entity SYSTEM
 * @description The studio game's boat deck: real strands as spirit passengers, the crew roster and the Chapter 1 gate bar (read-only)
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login. Vercel preview deployments, already behind Vercel's own login, open without it
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { loadDeck } from '@/lib/studio/deck'
import { studioPage } from '@/lib/studio/page'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const preview = process.env.VERCEL_ENV === 'preview'
  if (!preview && !(await isBoardOwner()))
    return NextResponse.redirect(new URL('/login?returnTo=/board/studio', req.url))
  const deck = await loadDeck()
  if (!deck) return new NextResponse('The call sheets could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  return new NextResponse(studioPage(deck), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY',
               'Referrer-Policy': 'same-origin' },
  })
}
