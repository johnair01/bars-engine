/**
 * @route GET /api/tap-the-vein/menu
 * @entity PLAYER
 * @description The latest sealed Tap the Vein morning menu, for the six-faces council to read
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @relationships PLAYER (TapTheVeinDailySession.morningMenu, LensGoal)
 * @dimensions WHO:the council, WHAT:kept lines bridged to Lens goals, WHERE:morning ritual, ENERGY:daily planning
 * @example GET /api/tap-the-vein/menu?date=2026-10-09&token=<COUNCIL_MENU_TOKEN>
 * @agentDiscoverable false
 */
import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { loadActiveLensGoals, loadLatestSealedMenu } from '@/lib/tap-the-vein/menu-data'

/**
 * The council reads one player's sealed menu: the kept lines, each with the
 * Lens goal it is bridged to. Never the free write (`mm-raw`); the export is
 * built from menu items only (src/lib/tap-the-vein/menu.ts, toMenuExport).
 *
 * Required env vars:
 *   COUNCIL_MENU_TOKEN      — read-only secret; it opens this route and nothing else
 *   COUNCIL_MENU_PLAYER_ID  — whose menu it reads
 *
 * The token comes as `Authorization: Bearer <token>` or as `?token=<token>`.
 * The query form is Wendell's ruling (board, `mm-menu-transport`, 2026-10-09):
 * the council reaches production only through the Vercel connector, which sends
 * a plain GET with no custom headers. The cost is that the token appears in
 * request logs; it can read this one menu and nothing else, and rotating it is
 * one env-var change.
 *
 * Optional query: ?date=YYYY-MM-DD for that day's menu; default is the latest sealed.
 * The response adds `goals`, his active Lens goals at read time, so the council
 * can bridge backlog items to goals the same way.
 */
function givenToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length)
  return req.nextUrl.searchParams.get('token')
}

function tokenMatches(token: string | null, secret: string): boolean {
  if (!token) return false
  const given = Buffer.from(token)
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !playerId) {
    return NextResponse.json({ error: 'Council menu export is not configured' }, { status: 503 })
  }
  if (!tokenMatches(givenToken(req), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = req.nextUrl.searchParams.get('date')
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  try {
    const menu = await loadLatestSealedMenu(playerId, date ?? undefined)
    if (!menu) return NextResponse.json({ error: 'No sealed menu' }, { status: 404 })
    const goals = (await loadActiveLensGoals(playerId)).map((g) => ({
      id: g.id,
      title: g.title,
      domain: g.domain,
      cadence: g.cadence,
      parentId: g.parentGoalId,
    }))
    return NextResponse.json({ ...menu, goals }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[api:ttv-menu]', e)
    return NextResponse.json({ error: 'Failed to load the menu' }, { status: 500 })
  }
}
