import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { toQuestDto } from '@/lib/bar-forge/match-bar-to-quests'
import { requireForgeBearerOrSession } from '@/lib/bar-forge/forge-or-session'

/**
 * GET /api/quests — canonical quest catalog slice (matchable CustomBar rows).
 * Auth: Bearer (BARS_API_KEY) or logged-in session.
 */
export async function GET(request: NextRequest) {
  const auth = await requireForgeBearerOrSession(request)
  if (!auth.ok) {
    return auth.response
  }

  const { searchParams } = new URL(request.url)
  const limitRaw = searchParams.get('limit')
  let limit = limitRaw ? parseInt(limitRaw, 10) : 100
  if (Number.isNaN(limit) || limit < 1) limit = 100
  if (limit > 500) limit = 500

  const campaignRef = searchParams.get('campaignRef')?.trim()
  const questSource = searchParams.get('questSource')?.trim()

  const where: Prisma.CustomBarWhereInput = {
    status: { in: ['active', 'draft'] },
  }
  if (campaignRef) where.campaignRef = campaignRef
  if (questSource) where.questSource = questSource

  const rows = await db.customBar.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      moveType: true,
      lockType: true,
      allyshipDomain: true,
      nation: true,
      archetype: true,
      kotterStage: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    quests: rows.map(toQuestDto),
    count: rows.length,
  })
}
