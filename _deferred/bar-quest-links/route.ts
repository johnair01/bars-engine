import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { questIdsExist } from '@/lib/bar-forge/validate-quest-ids'
import { barQuestLinkCreateSchema } from '@/lib/bar-quest-link/schemas'
import { playerOwnsBar } from '@/lib/bar-quest-link/permissions'

/**
 * GET /api/bar-quest-links?sourceBarId=…
 * POST /api/bar-quest-links — create link (source BAR must be yours or admin)
 */
export async function GET(request: NextRequest) {
  const player = await getCurrentPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sourceBarId = searchParams.get('sourceBarId')?.trim()
  if (!sourceBarId) {
    return NextResponse.json({ error: 'sourceBarId query required' }, { status: 400 })
  }

  const source = await db.customBar.findUnique({
    where: { id: sourceBarId },
    select: { creatorId: true },
  })
  if (!source) {
    return NextResponse.json({ error: 'Source BAR not found' }, { status: 404 })
  }

  if (!playerOwnsBar(player.id, player.roles, source.creatorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const links = await db.barQuestLink.findMany({
    where: { sourceBarId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      targetQuest: { select: { id: true, title: true, status: true, moveType: true } },
    },
  })

  return NextResponse.json({ links })
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

  const parsed = barQuestLinkCreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const body = parsed.data
  const source = await db.customBar.findUnique({
    where: { id: body.sourceBarId },
    select: { id: true, creatorId: true },
  })
  if (!source) {
    return NextResponse.json({ error: 'Source BAR not found' }, { status: 404 })
  }
  if (!playerOwnsBar(player.id, player.roles, source.creatorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!(await questIdsExist([body.targetQuestId]))) {
    return NextResponse.json({ error: 'targetQuestId does not exist' }, { status: 400 })
  }

  let instanceId = body.instanceId ?? null
  const campaignRef = body.campaignRef?.trim() || null
  if (!instanceId && campaignRef) {
    const inst = await db.instance.findFirst({
      where: { campaignRef },
      select: { id: true },
    })
    instanceId = inst?.id ?? null
  }

  const created = await db.barQuestLink.create({
    data: {
      sourceBarId: body.sourceBarId,
      targetQuestId: body.targetQuestId,
      matchType: body.matchType,
      confidence: body.confidence ?? undefined,
      reason: body.reason,
      supportedBy:
        body.supportedBy !== undefined && body.supportedBy !== null
          ? (body.supportedBy as Prisma.InputJsonValue)
          : undefined,
      campaignRef,
      instanceId,
      createdByPlayerId: player.id,
    },
    include: {
      targetQuest: { select: { id: true, title: true, status: true, moveType: true } },
    },
  })

  return NextResponse.json({ link: created })
}
