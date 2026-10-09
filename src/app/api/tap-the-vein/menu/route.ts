/**
 * @route GET /api/tap-the-vein/menu
 * @entity PLAYER
 * @description The latest sealed Tap the Vein morning menu, for the six-faces council to read
 * @permissions bearer token (COUNCIL_MENU_TOKEN)
 * @relationships PLAYER (TapTheVeinDailySession.morningMenu, LensGoal)
 * @dimensions WHO:the council, WHAT:kept lines bridged to Lens goals, WHERE:morning ritual, ENERGY:daily planning
 * @example GET /api/tap-the-vein/menu?date=2026-10-09 (with Authorization: Bearer <COUNCIL_MENU_TOKEN>)
 * @agentDiscoverable false
 */
import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { loadLatestSealedMenu } from '@/lib/tap-the-vein/menu-data'

/**
 * The council reads one player's sealed menu: the kept lines, each with the
 * Lens goal it is bridged to. Never the free write (`mm-raw`); the export is
 * built from menu items only (src/lib/tap-the-vein/menu.ts, toMenuExport).
 *
 * Required env vars:
 *   COUNCIL_MENU_TOKEN      — shared secret the council sends as a bearer token
 *   COUNCIL_MENU_PLAYER_ID  — whose menu it reads
 *
 * Optional query: ?date=YYYY-MM-DD for that day's menu; default is the latest sealed.
 */
function tokenMatches(header: string | null, secret: string): boolean {
  if (!header?.startsWith('Bearer ')) return false
  const given = Buffer.from(header.slice('Bearer '.length))
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !playerId) {
    return NextResponse.json({ error: 'Council menu export is not configured' }, { status: 503 })
  }
  if (!tokenMatches(req.headers.get('authorization'), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = req.nextUrl.searchParams.get('date')
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  try {
    const menu = await loadLatestSealedMenu(playerId, date ?? undefined)
    if (!menu) return NextResponse.json({ error: 'No sealed menu' }, { status: 404 })
    return NextResponse.json(menu, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[api:ttv-menu]', e)
    return NextResponse.json({ error: 'Failed to load the menu' }, { status: 500 })
  }
}
