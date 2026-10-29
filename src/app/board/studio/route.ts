/**
 * @route GET /board/studio
 * @entity SYSTEM
 * @description The studio game's boat: the Clockwork Orrery's run, dock, intake and launch loop, and behind ?fleet=1 the six face ships in convoy with each ship's own loop; learning seeds read from the board's ledger (read-only). Behind ?shaman=1 the Shaman's loop: the Gourd Star's eight rooms, whose cards save through POST /api/board/saves
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login. Vercel preview deployments, already behind Vercel's own login, open without it
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { loadFleet } from '@/lib/studio/fleet'
import { studioPage } from '@/lib/studio/page'
import { loadShaman, type StepDoc, type StoreCold } from '@/lib/studio/shaman'
import { shamanPage } from '@/lib/studio/shaman-page'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const preview = process.env.VERCEL_ENV === 'preview'
  if (!preview && !(await isBoardOwner()))
    return NextResponse.redirect(new URL('/login?returnTo=' + encodeURIComponent('/board/studio' + req.nextUrl.search), req.url))
  if (req.nextUrl.searchParams.get('shaman') === '1') return shaman()
  const world = await loadFleet()
  if (!world) return new NextResponse('The board ledger could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  return new NextResponse(studioPage(world), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY',
               'Referrer-Policy': 'same-origin' },
  })
}

const HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' }

/** The Shaman's loop. Look and blocking steps live only in the board store; with no database (local, CI) the still pool
 * has none waiting. A store failure never breaks the page: where a store is configured it goes cold and holds the
 * Hearth, so he sees what failed and when. */
async function shaman() {
  let steps: Record<string, StepDoc> | null = null, storeCold: StoreCold | null = null
  try {
    const { latestDocs } = await import('@/lib/board/store')
    steps = ((await latestDocs('council')).steps ?? null) as Record<string, StepDoc> | null
  } catch (e) {
    steps = null
    if (process.env.DATABASE_URL) storeCold = { at: new Date().toISOString(), why: e instanceof Error ? e.message.split('\n')[0].slice(0, 240) : String(e).slice(0, 240) }
  }
  const world = await loadShaman(steps, new Date(), storeCold)
  if (!world) return new NextResponse('The board ledger could not be loaded from GitHub. Try again in a minute.', { status: 503 })
  return new NextResponse(shamanPage(world), { headers: HEADERS })
}
