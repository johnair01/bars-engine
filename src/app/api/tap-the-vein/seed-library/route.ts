/**
 * @route GET /api/tap-the-vein/seed-library
 * @entity PLAYER
 * @description The commitments he set aside to draw from later: text, the day each was named, when it was set aside, its rung on the resurfacing ladder and whether it came back today
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @relationships PLAYER (TapTheVeinTask with status resting)
 * @dimensions WHO:the council, WHAT:set-aside commitments, WHERE:the Council Board's seed library, ENERGY:deferred tasks
 * @example GET /api/tap-the-vein/seed-library
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { LIBRARY_NOTE_KIND, RESURFACE_LADDER_DAYS, RESTING_STATUS, toSeedLibrary } from '@/lib/tap-the-vein/seed-library'

/**
 * Read by the Council Board (six-faces-council docs/seed-library.md) so the board can show the library he
 * draws from. Same token and player as /api/tap-the-vein/menu. Read only: drawing a seed or keeping it resting happens in bars-engine.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !playerId) {
    return NextResponse.json({ error: 'Council seed library export is not configured' }, { status: 503 })
  }
  if (!tokenMatches(givenToken(req), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await db.tapTheVeinTask.findMany({
      where: { playerId, status: RESTING_STATUS },
      select: {
        id: true,
        originalText: true,
        updatedAt: true,
        lensGoalId: true,
        barId: true,
        questId: true,
        dailySession: { select: { sessionDate: true } },
        notes: { where: { kind: LIBRARY_NOTE_KIND }, select: { body: true, createdAt: true } },
      },
    })
    return NextResponse.json({ seeds: toSeedLibrary(rows), ladder: RESURFACE_LADDER_DAYS }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[api:ttv-seed-library]', e)
    return NextResponse.json({ error: 'Failed to load the seed library' }, { status: 500 })
  }
}
