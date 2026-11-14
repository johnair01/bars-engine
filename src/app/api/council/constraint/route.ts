/**
 * @route GET /api/council/constraint
 * @entity SYSTEM
 * @description The dated constraint read: which lane is the constraint, and the highest-leverage move against it
 * @permissions COUNCIL_MENU_TOKEN sees every lane; CONSTRAINT_LANE_TOKENS holds one token per client, scoped to its lane
 * @example GET /api/council/constraint?as_of=2026-11-09&format=json
 * @agentDiscoverable false
 *
 * The snapshot is pushed content, not a computation. `council/tools/constraint.py --json` writes one,
 * `council/tools/constraint_push.py` saves it to the boards' store as board "council", collection "constraint",
 * docId the snapshot's date, and this route reads it back. Nothing is read from a repository at request time.
 * The contract is six-faces-council `docs/specs/constraint-route-brief.md`.
 *
 * One lane is the constraint; the others are context. Nothing here rates a person, and no caller receives another
 * client's lane by name or by number.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { checkSnapshot, isRealDate, laneTokens, scoped, shape } from '@/lib/council/constraint'

export const dynamic = 'force-dynamic'

/** The read is one dated row, so a cached copy would be a copy of the wrong day. */
const NO_STORE = { 'Cache-Control': 'no-store' }
const BOARD = 'council'
const COLLECTION = 'constraint'
const FORMATS = new Set(['json', 'card'])

export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'Council export is not configured' }, { status: 503 })

  const given = givenToken(req)
  let lane: string | null = null
  let allowed = tokenMatches(given, secret)
  if (!allowed) {
    const { tokens, loud } = laneTokens(process.env.CONSTRAINT_LANE_TOKENS)
    for (const line of loud) console.error('[api:constraint]', line)
    // Every entry is compared, so which lane a token names cannot be read off the clock.
    for (const [token, key] of Object.entries(tokens)) {
      if (tokenMatches(given, token)) {
        allowed = true
        lane = key
      }
    }
  }
  if (!allowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const asOf = req.nextUrl.searchParams.get('as_of')
  if (asOf !== null && !isRealDate(asOf)) {
    return NextResponse.json({ error: 'as_of must be a date, YYYY-MM-DD' }, { status: 400 })
  }
  const format = req.nextUrl.searchParams.get('format') ?? 'json'
  if (!FORMATS.has(format)) return NextResponse.json({ error: 'format must be json or card' }, { status: 400 })
  // The card draws every lane, so a lane token asking for it would be handed the portfolio it was kept from.
  if (format === 'card' && lane !== null) return NextResponse.json({ error: 'The card shows every lane' }, { status: 403 })

  try {
    const row = await db.boardSave.findFirst({
      where: { board: BOARD, collection: COLLECTION, ...(asOf ? { docId: asOf } : {}) },
      orderBy: { receivedAt: 'desc' },
      select: { docId: true, data: true },
    })
    if (!row) return NextResponse.json({ error: `No constraint snapshot for ${asOf ?? 'any date'}` }, { status: 404 })

    const checked = checkSnapshot(row.data)
    if (!checked.ok) {
      console.error('[api:constraint] refused snapshot', row.docId, checked.error)
      return NextResponse.json({ error: 'The snapshot is refused' }, { status: 500 })
    }

    if (format === 'card') {
      if (!checked.snapshot.card_html) return NextResponse.json({ error: 'That snapshot carries no card' }, { status: 400 })
      return new NextResponse(checked.snapshot.card_html, {
        headers: { ...NO_STORE, 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (lane === null) return NextResponse.json(shape(checked.snapshot), { headers: NO_STORE })

    const body = scoped(checked.snapshot, lane)
    if (!body) {
      // The configured lane and the snapshot's lanes disagree, so nobody gets a read rather than everybody.
      console.error('[api:constraint] a lane token names a lane this snapshot does not have:', lane)
      return NextResponse.json({ error: 'The snapshot is refused' }, { status: 500 })
    }
    return NextResponse.json(body, { headers: NO_STORE })
  } catch (e) {
    console.error('[api:constraint]', e)
    return NextResponse.json({ error: 'Failed to read the snapshot' }, { status: 500 })
  }
}
