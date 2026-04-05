import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { toQuestDto } from '@/lib/bar-forge/match-bar-to-quests'
import { requireForgeBearerOrSession } from '@/lib/bar-forge/forge-or-session'
import { CreateQuestSchema } from '@/lib/generated-quest-registry/schema'
import {
  createGeneratedQuestRecord,
  UnknownBookError,
} from '@/lib/generated-quest-registry/create-generated-quest'
import { registryRowToResponse } from '@/lib/generated-quest-registry/to-response'

/**
 * GET /api/quests — canonical quest catalog slice (matchable CustomBar rows).
 * POST /api/quests — persist a BAR-forge / GPT generated quest registry entry (global; optional bookId).
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

export async function POST(request: NextRequest) {
  const auth = await requireForgeBearerOrSession(request)
  if (!auth.ok) {
    return auth.response
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateQuestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const row = await createGeneratedQuestRecord(parsed.data)
    return NextResponse.json(registryRowToResponse(row), { status: 201 })
  } catch (e) {
    if (e instanceof UnknownBookError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    const message = e instanceof Error ? e.message : 'Failed to create quest'
    console.error('[POST /api/quests]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
