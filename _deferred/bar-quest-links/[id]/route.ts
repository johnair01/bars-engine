import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { barQuestLinkPatchSchema } from '@/lib/bar-quest-link/schemas'
import {
  playerCanConfirmBarQuestLink,
  playerOwnsBar,
} from '@/lib/bar-quest-link/permissions'

/**
 * GET /api/bar-quest-links/:id
 * PATCH /api/bar-quest-links/:id — status transition (see spec D5)
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const player = await getCurrentPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const link = await db.barQuestLink.findUnique({
    where: { id },
    include: {
      sourceBar: { select: { id: true, creatorId: true } },
      targetQuest: { select: { id: true, title: true, status: true, moveType: true } },
    },
  })
  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const canSee =
    playerOwnsBar(player.id, player.roles, link.sourceBar.creatorId) ||
    link.createdByPlayerId === player.id ||
    (await playerCanConfirmBarQuestLink(player.id, player.roles, link))

  if (!canSee) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ link })
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const player = await getCurrentPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = barQuestLinkPatchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { status: nextStatus } = parsed.data

  const link = await db.barQuestLink.findUnique({
    where: { id },
    include: {
      sourceBar: { select: { id: true, creatorId: true } },
    },
  })
  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (nextStatus === 'withdrawn') {
    const canWithdraw =
      link.createdByPlayerId === player.id ||
      playerOwnsBar(player.id, player.roles, link.sourceBar.creatorId)
    if (!canWithdraw) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    const canReview = await playerCanConfirmBarQuestLink(player.id, player.roles, link)
    if (!canReview) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (link.status !== 'proposed') {
    return NextResponse.json({ error: 'Only proposed links can change status' }, { status: 409 })
  }

  const updated = await db.barQuestLink.update({
    where: { id },
    data: {
      status: nextStatus,
      reviewedByPlayerId: nextStatus === 'withdrawn' ? null : player.id,
      reviewedAt: nextStatus === 'withdrawn' ? null : new Date(),
    },
    include: {
      targetQuest: { select: { id: true, title: true, status: true, moveType: true } },
    },
  })

  return NextResponse.json({ link: updated })
}
