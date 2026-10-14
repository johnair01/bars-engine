/**
 * @route GET /api/tap-the-vein/status
 * @entity PLAYER
 * @description Whether the council's player has sealed Tap the Vein on a given day, and nothing else
 * @permissions none; it answers one yes or no for COUNCIL_MENU_PLAYER_ID
 * @relationships PLAYER (TapTheVeinDailySession.morningMenu)
 * @dimensions WHO:the council board, WHAT:sealed today or not, WHERE:morning ritual, ENERGY:daily planning
 * @example GET /api/tap-the-vein/status?date=2026-10-15
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { loadLatestSealedMenu } from '@/lib/tap-the-vein/menu-data'

/**
 * The Council Board opens on Tap the Vein until today's is done (six-faces-council `ttv-first-gate`). Wendell
 * overruled taking his word that he did it here (`ttv-bars-engine-trusted`, 2026-10-14: "I do think we need to be
 * able to make an API call to bars-engine directly"), so the board asks this route through the viewer's Vercel
 * connector, which sends a plain GET with no headers.
 *
 * It takes no token, because the board page cannot hold one (`mm-menu-transport`). So it says only whether a menu
 * was sealed on that day and when: no lines, no goals, no free write. The menu itself stays behind the token at
 * /api/tap-the-vein/menu.
 *
 * Required env var: COUNCIL_MENU_PLAYER_ID. Query: ?date=YYYY-MM-DD, required (the board sends its own local date).
 */
export async function GET(req: NextRequest) {
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!playerId) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }
  try {
    const menu = await loadLatestSealedMenu(playerId, date)
    return NextResponse.json(
      { date, sealed: !!menu, sealedAt: menu?.sealedAt ?? null },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    console.error('[api:ttv-status]', e)
    return NextResponse.json({ error: 'Failed to check' }, { status: 500 })
  }
}
