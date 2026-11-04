/**
 * @route GET /api/tap-the-vein/unchosen
 * @entity PLAYER
 * @description The whole context for the council's weekly read (six-faces-council `.specify/specs/unchosen-gold`,
 *   contract 1): each morning's free write, the unchosen brainstorm lines and the seeds with their fates, the old
 *   read's live pitches and his Lens goals, over the 60-day window, leaving out what an earlier read handled. Pass
 *   `since=YYYY-MM-DD` to start the window elsewhere. Read in place: the council keeps no copy (uc-who-reads B).
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @relationships PLAYER (TapTheVeinDailySession, TapTheVeinTask, TapTheVeinUnchosenPitch, CustomBar, CompostLedger, LensGoal)
 * @dimensions WHO:the council, WHAT:the whole context of the week, WHERE:the council's weekly read, ENERGY:ideas not chosen and gold in the lead
 * @example GET /api/tap-the-vein/unchosen?whole=1
 * @agentDiscoverable false
 *
 * @route POST /api/tap-the-vein/unchosen
 * @description Write the week's read (contract 4): at most five nuggets of gold, each a passage quoted word for word,
 *   and the fragments the read found nothing in. Checked first (src/lib/tap-the-vein/unchosen-read.ts); with
 *   dry: true nothing is written. Otherwise one transaction writes the scroll BAR, the gold BARs and the compost rows.
 * @permissions COUNCIL_MENU_TOKEN
 * @example POST /api/tap-the-vein/unchosen {"weekOf":"2026-11-02","gold":[{"itemKey":"2026-11-02:fw","quote":"…","kind":"idea","face":"shaman","reason":"…","title":"…","fate":"kept"}],"compost":[],"dry":true}
 */
import { NextRequest, NextResponse } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { planGoldRead, READ_MAX_GOLD, weekOf } from '@/lib/tap-the-vein/unchosen-read'
import { livePitches, loadWholeContext, weekRead, writeGoldRead } from '@/lib/tap-the-vein/unchosen-store'
import { itemsOf } from '@/lib/tap-the-vein/unchosen-whole'

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
  const since = req.nextUrl.searchParams.get('since')
  if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) return NextResponse.json({ error: 'since must be YYYY-MM-DD' }, { status: 400 })
  try {
    const today = startOfDay()
    const day = today.toISOString().slice(0, 10)
    const whole = await loadWholeContext(playerId, today, since)
    // Every read is logged with no text, so he can see when and how much the council read (ttv-saved-read-scoped).
    console.info('[api:ttv-unchosen] read', { since: whole.since, mornings: whole.mornings.length, at: new Date().toISOString() })
    return NextResponse.json(
      { today: day, weekOf: weekOf(day), readThisWeek: await weekRead(playerId, weekOf(day)), maxGold: READ_MAX_GOLD, ...whole },
      { headers: NO_STORE },
    )
  } catch (e) {
    console.error('[api:ttv-unchosen]', e)
    return NextResponse.json({ error: 'Failed to load the whole context' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const playerId = refused(req)
  if (typeof playerId !== 'string') return playerId
  const b = (await req.json().catch(() => null)) as { weekOf?: unknown; gold?: unknown; compost?: unknown; dry?: unknown } | null
  if (!b) return NextResponse.json({ error: 'Expected {weekOf, gold: [...], compost: [...], dry?}' }, { status: 400 })
  try {
    const today = startOfDay()
    const day = today.toISOString().slice(0, 10)
    const [whole, live, read] = await Promise.all([
      loadWholeContext(playerId, today, null), livePitches(playerId), weekRead(playerId, weekOf(day)),
    ])
    const checked = planGoldRead(itemsOf(whole), live, b, day, read)
    if ('problems' in checked) return NextResponse.json({ problems: checked.problems }, { status: 422, headers: NO_STORE })
    const { plan } = checked
    const dry = b.dry === true
    const wrote = dry ? null : await writeGoldRead(playerId, plan)
    return NextResponse.json(
      {
        dry,
        weekOf: plan.weekOf,
        ...(wrote ?? {}),
        plan: { gold: plan.gold.map((g) => ({ itemKey: g.itemKey, fate: g.fate, strand: g.strand })), compost: plan.compost.map((c) => c.itemKey), compostLine: plan.compostLine },
      },
      { headers: NO_STORE },
    )
  } catch (e) {
    console.error('[api:ttv-unchosen]', e)
    return NextResponse.json({ error: 'Failed to write the read' }, { status: 500 })
  }
}
