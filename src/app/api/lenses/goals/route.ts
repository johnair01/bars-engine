/**
 * @route GET /api/lenses/goals
 * @entity PLAYER
 * @description The player's active Lens goals by domain, for the six-faces council's Morning tab
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @relationships PLAYER (LensGoal)
 * @dimensions WHO:the council, WHAT:active Lens goals per domain, WHERE:morning board, ENERGY:daily planning
 * @example GET /api/lenses/goals?token=<COUNCIL_MENU_TOKEN>
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { LENS_DOMAINS } from '@/lib/lenses/domains'
import { loadActiveLensGoals } from '@/lib/tap-the-vein/menu-data'

/**
 * The board reads his Lens goals every morning without a sealed Tap the Vein menu
 * (board, `lens-board-reads-goals`, 2026-10-14). Same token and player as
 * /api/tap-the-vein/menu; it reads goals and nothing else.
 *
 * `goals` is the flat list in the menu export's shape; `domains` lists all five
 * Lens domains in order, each with its prompt and its goals, so an empty domain
 * still shows (and its prompt can seed the Tap the Vein box later, `lens-pitch-goals`).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !playerId) {
    return NextResponse.json({ error: 'Council goals export is not configured' }, { status: 503 })
  }
  if (!tokenMatches(givenToken(req), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const goals = (await loadActiveLensGoals(playerId)).map((g) => ({
      id: g.id,
      title: g.title,
      domain: g.domain,
      cadence: g.cadence,
      parentId: g.parentGoalId,
    }))
    const domains = LENS_DOMAINS.map((d) => ({
      key: d.key,
      label: d.label,
      prompt: d.prompt,
      goals: goals.filter((g) => g.domain === d.key),
    }))
    return NextResponse.json(
      { readAt: new Date().toISOString(), goals, domains },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    console.error('[api:lens-goals]', e)
    return NextResponse.json({ error: 'Failed to load Lens goals' }, { status: 500 })
  }
}
