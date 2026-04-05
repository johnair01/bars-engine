import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { campaignDraftCreateSchema } from '@/lib/bar-quest-link/schemas'

/**
 * GET /api/campaign-drafts — list current player’s drafts
 * POST /api/campaign-drafts — create draft
 */
export async function GET() {
  const player = await getCurrentPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const drafts = await db.campaignDraft.findMany({
    where: { playerId: player.id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ drafts })
}

export async function POST(request: NextRequest) {
  const player = await getCurrentPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = campaignDraftCreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const body = parsed.data
  const structure = body.structure ?? {}

  const created = await db.campaignDraft.create({
    data: {
      playerId: player.id,
      title: body.title ?? null,
      contentLayer: body.contentLayer,
      playerArc: body.playerArc as Prisma.InputJsonValue,
      campaignContext: body.campaignContext as Prisma.InputJsonValue,
      structure: structure as Prisma.InputJsonValue,
    },
  })

  return NextResponse.json({ draft: created })
}
