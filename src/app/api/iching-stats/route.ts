/**
 * GET /api/iching-stats
 *
 * Returns I Ching frequency analysis:
 *   - Cast counts per hexagram (1-64)
 *   - Choice counts per face
 *   - Face x Hexagram matrix
 *
 * Used for:
 *   - Informing which hexagrams get bespoke question treatment
 *   - Community wisdom patterns (which faces get chosen most per hexagram)
 *   - Quarterly craft review
 *
 * Access: authenticated players see their own stats;
 *         admin role sees aggregate stats across all players.
 */

import { NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const player = await getCurrentPlayer()

  if (!player) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const isAdmin = player.roles?.some((r: any) => r.role?.name === 'admin')

  // Hexagram cast counts from PlayerBar (source: 'iching')
  const hexagramCounts = await db.playerBar.groupBy({
    by: ['barId'],
    where: { source: 'iching' },
    _count: { barId: true },
    orderBy: { _count: { barId: 'desc' } },
  })

  // Face choice counts from IChingCastEvent
  let faceCounts: any[] = []
  let faceHexagramMatrix: any[] = []
  try {
    faceCounts = await db.$queryRaw`
      SELECT "chosenFace", COUNT(*)::int as count
      FROM iching_cast_events
      GROUP BY "chosenFace"
      ORDER BY count DESC
    `

    faceHexagramMatrix = await db.$queryRaw`
      SELECT "hexagramId", "chosenFace", COUNT(*)::int as count
      FROM iching_cast_events
      GROUP BY "hexagramId", "chosenFace"
      ORDER BY "hexagramId", count DESC
    `
  } catch {
    // iching_cast_events table may not exist yet (pre-migration)
    faceCounts = []
    faceHexagramMatrix = []
  }

  // If not admin, restrict to player's own casts
  const playerHexagramCounts = isAdmin
    ? hexagramCounts
    : await db.playerBar.groupBy({
        by: ['barId'],
        where: { playerId: player.id, source: 'iching' },
        _count: { barId: true },
        orderBy: { _count: { barId: 'desc' } },
      })

  const playerFaceCounts = isAdmin
    ? faceCounts
    : await (async () => {
        try {
          return await db.$queryRaw`
            SELECT "chosenFace", COUNT(*)::int as count
            FROM iching_cast_events
            WHERE "playerId" = ${player.id}
            GROUP BY "chosenFace"
            ORDER BY count DESC
          `
        } catch {
          return []
        }
      })()

  const totalCasts = hexagramCounts.reduce((sum, r) => sum + r._count.barId, 0)
  const totalFaceChoices = faceCounts.reduce((sum: number, r: any) => sum + r.count, 0)

  return NextResponse.json({
    isAdmin,
    summary: {
      totalCasts,
      totalFaceChoices,
      uniqueHexagramsCasts: hexagramCounts.length,
    },
    hexagrams: playerHexagramCounts.map((r) => ({
      hexagramId: r.barId,
      castCount: r._count.barId,
    })),
    faces: playerFaceCounts.map((r: any) => ({
      face: r.chosenFace,
      choiceCount: r.count,
    })),
    faceHexagramMatrix: isAdmin
      ? faceHexagramMatrix.map((r: any) => ({
          hexagramId: r.hexagramId,
          face: r.chosenFace,
          count: r.count,
        }))
      : 'admin only',
  })
}
