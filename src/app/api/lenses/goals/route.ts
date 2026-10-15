/**
 * @route GET /api/lenses/goals
 * @entity PLAYER
 * @description The player's active Lens goals by domain, for the six-faces council's Morning tab
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @relationships PLAYER (LensGoal)
 * @dimensions WHO:the council, WHAT:active Lens goals per domain, WHERE:morning board, ENERGY:daily planning
 * @example GET /api/lenses/goals?token=<COUNCIL_MENU_TOKEN>
 * @agentDiscoverable false
 *
 * @route POST /api/lenses/goals
 * @description Adds year goals he kept on the council board as active Lens goals
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @example POST /api/lenses/goals {"goals":[{"domain":"health","title":"...","source":"Council Board, lens-...","parentId":"<optional active goal id>"}]}
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { LENS_DOMAINS, isLensDomainKey } from '@/lib/lenses/domains'
import { ensureYearlyLens } from '@/lib/lenses/onboarding-data'
import { loadActiveLensGoals } from '@/lib/tap-the-vein/menu-data'

/**
 * The board reads his Lens goals every morning without a sealed Tap the Vein menu
 * (board, `lens-board-reads-goals`, 2026-10-14). Same token and player as
 * /api/tap-the-vein/menu; GET reads goals, POST adds the year goals he kept on the board.
 *
 * `goals` is the flat list in the menu export's shape; `domains` lists all five
 * Lens domains in order, each with its prompt and its goals, so an empty domain
 * still shows (and its prompt can seed the Tap the Vein box later, `lens-pitch-goals`).
 */
function councilPlayer(req: NextRequest): { playerId: string } | NextResponse {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !playerId) {
    return NextResponse.json({ error: 'Council goals export is not configured' }, { status: 503 })
  }
  if (!tokenMatches(givenToken(req), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { playerId }
}

export async function GET(req: NextRequest) {
  const who = councilPlayer(req)
  if (who instanceof NextResponse) return who
  const { playerId } = who

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

const MAX_TITLE = 160
const MAX_GOALS = 10

type PitchedGoal = { domain: string; title: string; source?: string; parentId?: string }

// One step smaller than the parent goal: the side quest that merges into the main quest (mm-menu-shape).
const SMALLER: Record<string, string> = { year: 'quarter', quarter: 'month', month: 'week', week: 'week' }

/**
 * Year goals he kept on the council board (board, `lens-pitch-goals`, 2026-10-14):
 * the board read pitches goals for an empty domain from his Tap the Vein free write,
 * and each one he keeps is written here as an active year goal under his yearly Lens.
 * `source` names the board row and his quoted line; it is kept as the description.
 *
 * A goal with `parentId` (board, `lens-intake-align`) is a smaller goal pitched for
 * an item on his daily intake: it is created one cadence below that active goal of
 * his, in the parent's domain.
 *
 * Safe to send twice: a goal whose domain, cadence, parent and title match an active
 * goal is returned as `existing` and not created again. Only his player.
 */
export async function POST(req: NextRequest) {
  const who = councilPlayer(req)
  if (who instanceof NextResponse) return who
  const { playerId } = who

  let body: { goals?: PitchedGoal[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON: {"goals": [{"domain", "title", "source"}]}' }, { status: 400 })
  }
  const pitched = Array.isArray(body.goals) ? body.goals : []
  if (pitched.length === 0 || pitched.length > MAX_GOALS) {
    return NextResponse.json({ error: `Send 1 to ${MAX_GOALS} goals` }, { status: 400 })
  }
  const bad = pitched.filter(
    (g) => !g || typeof g.title !== 'string' || !g.title.trim() || typeof g.domain !== 'string' || !isLensDomainKey(g.domain),
  )
  if (bad.length) {
    return NextResponse.json({ error: 'Each goal needs a title and one of the five Lens domains', bad }, { status: 400 })
  }

  try {
    const lens = await ensureYearlyLens(playerId)
    const out: { id: string; title: string; domain: string; cadence: string; status: 'created' | 'existing' | 'no-parent' }[] = []
    for (const g of pitched) {
      const title = g.title.trim().slice(0, MAX_TITLE)
      let domain = g.domain
      let cadence = 'year'
      let parentGoalId: string | null = null
      if (typeof g.parentId === 'string' && g.parentId) {
        const parent = await db.lensGoal.findFirst({
          where: { id: g.parentId, playerId, status: 'active' },
          select: { id: true, domain: true, cadence: true },
        })
        if (!parent) {
          out.push({ id: '', title, domain, cadence, status: 'no-parent' })
          continue
        }
        domain = parent.domain
        cadence = SMALLER[parent.cadence] ?? 'week'
        parentGoalId = parent.id
      }
      const same = await db.lensGoal.findFirst({
        where: { playerId, domain, cadence, status: 'active', parentGoalId, title },
        select: { id: true },
      })
      if (same) {
        out.push({ id: same.id, title, domain, cadence, status: 'existing' })
        continue
      }
      const siblings = await db.lensGoal.count({
        where: { playerId, domain, cadence, status: 'active', parentGoalId },
      })
      const created = await db.lensGoal.create({
        data: {
          playerId,
          lensId: lens.id,
          domain,
          cadence,
          parentGoalId,
          title,
          description: typeof g.source === 'string' ? g.source.slice(0, 500) : null,
          alignmentType: 'progress',
          status: 'active',
          keepOrder: siblings + 1,
        },
        select: { id: true },
      })
      out.push({ id: created.id, title, domain, cadence, status: 'created' })
    }
    return NextResponse.json({ goals: out }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[api:lens-goals:post]', e)
    return NextResponse.json({ error: 'Failed to save Lens goals' }, { status: 500 })
  }
}
