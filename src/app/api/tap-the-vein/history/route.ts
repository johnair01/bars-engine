/**
 * @route GET /api/tap-the-vein/history
 * @entity PLAYER
 * @description His past Tap the Vein days: each free write and the seeds committed from it, with each seed's BAR maturity
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @relationships PLAYER (TapTheVeinDailySession, TapTheVeinTask, CustomBar)
 * @dimensions WHO:the council, WHAT:saved free writes and their seeds, WHERE:council lens emergence pass, ENERGY:long-term goals
 * @example GET /api/tap-the-vein/history?since=2026-07-01
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { parseSince, toVeinHistory } from '@/lib/tap-the-vein/vein-history'

/**
 * Read by the council's lens emergence pass (Six-faces-council `council/lens_emerge.py`,
 * pass ttv-loop 1, 2026-10-16). Same token and player as /api/tap-the-vein/menu. The
 * council reads the free writes and keeps no copy; only goals he keeps on the board come
 * back, through POST /api/lenses/goals.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !playerId) {
    return NextResponse.json({ error: 'Council history export is not configured' }, { status: 503 })
  }
  if (!tokenMatches(givenToken(req), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const since = parseSince(req.nextUrl.searchParams.get('since'), now)
  if (!since) return NextResponse.json({ error: 'since must be YYYY-MM-DD' }, { status: 400 })

  try {
    const sessions = await db.tapTheVeinDailySession.findMany({
      where: { playerId, sessionDate: { gte: since } },
      orderBy: { sessionDate: 'asc' },
      select: {
        sessionDate: true,
        status: true,
        sealedAt: true,
        rawEntry: true,
        wordCount: true,
        lensCategory: true,
        tasks: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            originalText: true,
            status: true,
            lensGoalId: true,
            barId: true,
            questId: true,
            chargeLevel: true,
            blockedAt: true,
            carryCount: true,
            completedAt: true,
            compostReason: true,
            // The council's BAR read (Six-faces-council pass ttv-bars 1) weighs how much context he has given a task, so
            // the export carries the count of his notes, never their text.
            _count: { select: { notes: true } },
          },
        },
      },
    })
    const barIds = sessions.flatMap((s) => s.tasks.map((t) => t.barId)).filter((id): id is string => !!id)
    const bars = barIds.length
      ? await db.customBar.findMany({
          where: { id: { in: barIds } },
          select: { id: true, seedMetabolization: true, archivedAt: true },
        })
      : []
    const history = toVeinHistory(sessions, bars, since, now)
    // Every read is logged, with no text, so he can see when and how much the council read (ttv-saved-read-scoped).
    console.info('[api:ttv-history] read', { since: history.since, days: history.days.length, at: history.readAt })
    return NextResponse.json(history, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[api:ttv-history]', e)
    return NextResponse.json({ error: 'Failed to load the vein history' }, { status: 500 })
  }
}
