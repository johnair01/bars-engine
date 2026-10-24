/**
 * @route GET /api/tap-the-vein/unchosen
 * @entity PLAYER
 * @description The lines he named on past mornings and did not choose, the words that keep coming back in them, and
 *   the council's live pitches, for the weekly read (six-faces-council council/unchosen_read.py). Read in place: the
 *   council keeps no copy (uc-who-reads B, 2026-10-21).
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @relationships PLAYER (TapTheVeinDailySession brainstorm lines, TapTheVeinUnchosenPitch)
 * @dimensions WHO:the council, WHAT:unchosen lines and pitches, WHERE:Tap the Vein's Not chosen view, ENERGY:idea energy not yet pulled into a flow
 * @example GET /api/tap-the-vein/unchosen
 * @agentDiscoverable false
 *
 * @route POST /api/tap-the-vein/unchosen
 * @description Write the week's read: at most five patterns, each with one pitch and his lines quoted from two or more
 *   mornings. A pattern that returns gets a new pitch and its old one is composted. Checked against the pile first
 *   (src/lib/tap-the-vein/unchosen-read.ts); with dry: true nothing is written.
 * @permissions COUNCIL_MENU_TOKEN
 * @example POST /api/tap-the-vein/unchosen {"patterns":[{"word":"garden","face":"shaman","kernel":"...","pitch":"...","quotes":[{"day":"2026-10-14","text":"..."}]}],"dry":true}
 */
import { NextRequest, NextResponse } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { unchosenPatterns } from '@/lib/tap-the-vein/unchosen'
import { planRead, READ_MAX_PATTERNS, weekOf } from '@/lib/tap-the-vein/unchosen-read'
import { livePitches, loadPile, loadPitchViews, weekRead, writeRead } from '@/lib/tap-the-vein/unchosen-store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

/** Local start-of-day, the convention getUnchosen uses, so the read and the view see the same pile. */
function startOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function refused(req: NextRequest): NextResponse | string {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !playerId) return NextResponse.json({ error: 'Council unchosen read is not configured' }, { status: 503 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return playerId
}

export async function GET(req: NextRequest) {
  const playerId = refused(req)
  if (typeof playerId !== 'string') return playerId
  try {
    const today = startOfDay()
    const lines = await loadPile(playerId, today)
    const day = today.toISOString().slice(0, 10)
    return NextResponse.json(
      { today: day, weekOf: weekOf(day), readThisWeek: await weekRead(playerId, weekOf(day)), maxPatterns: READ_MAX_PATTERNS,
        lines, patterns: unchosenPatterns(lines, 12), pitches: await loadPitchViews(playerId) },
      { headers: NO_STORE },
    )
  } catch (e) {
    console.error('[api:ttv-unchosen]', e)
    return NextResponse.json({ error: 'Failed to load the unchosen lines' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const playerId = refused(req)
  if (typeof playerId !== 'string') return playerId
  const b = (await req.json().catch(() => null)) as { patterns?: unknown; dry?: unknown } | null
  if (!b) return NextResponse.json({ error: 'Expected {patterns: [...], dry?}' }, { status: 400 })
  try {
    const today = startOfDay()
    const day = today.toISOString().slice(0, 10)
    const [pile, live, read] = await Promise.all([loadPile(playerId, today), livePitches(playerId), weekRead(playerId, weekOf(day))])
    const checked = planRead(pile, live, b.patterns, day, read)
    if ('problems' in checked) return NextResponse.json({ problems: checked.problems }, { status: 422, headers: NO_STORE })
    const dry = b.dry === true
    const wrote = dry ? { created: 0, composted: 0 } : await writeRead(playerId, checked.plan)
    return NextResponse.json(
      { dry, weekOf: checked.plan.weekOf, ...wrote, plan: { create: checked.plan.create.map((p) => p.word), compost: checked.plan.compost.map((c) => c.word) } },
      { headers: NO_STORE },
    )
  } catch (e) {
    console.error('[api:ttv-unchosen]', e)
    return NextResponse.json({ error: 'Failed to write the read' }, { status: 500 })
  }
}
