import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { campaignDraftPatchSchema } from '@/lib/bar-quest-link/schemas'

function isAdmin(roles: { role: { key: string } }[] | undefined): boolean {
  return !!roles?.some((r) => r.role.key === 'admin')
}

/**
 * GET /api/campaign-drafts/:id
 * PATCH /api/campaign-drafts/:id
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
  const draft = await db.campaignDraft.findUnique({ where: { id } })
  if (!draft) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (draft.playerId !== player.id && !isAdmin(player.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ draft })
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

  const parsed = campaignDraftPatchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const existing = await db.campaignDraft.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (existing.playerId !== player.id && !isAdmin(player.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = parsed.data
  const data: Prisma.CampaignDraftUpdateInput = {}
  if (body.title !== undefined) data.title = body.title
  if (body.contentLayer !== undefined) data.contentLayer = body.contentLayer
  if (body.status !== undefined) data.status = body.status
  if (body.playerArc !== undefined) data.playerArc = body.playerArc as Prisma.InputJsonValue
  if (body.campaignContext !== undefined) {
    data.campaignContext = body.campaignContext as Prisma.InputJsonValue
  }
  if (body.structure !== undefined) data.structure = body.structure as Prisma.InputJsonValue

  const updated = await db.campaignDraft.update({
    where: { id },
    data,
  })

  return NextResponse.json({ draft: updated })
}
