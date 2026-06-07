import { db } from '@/lib/db'
import { createAltarPost, listAltarBoard } from '@/lib/valkyrie-party/service'
import { getCurrentPartyActor, requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const board = await listAltarBoard(searchParams.get('category') || '')
    return Response.json({ ok: true, ...board })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load altar'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getCurrentPartyActor()
    const body = await request.json()
    let assetId = body.asset_id ? String(body.asset_id) : ''
    if (!assetId && body.asset_url && actor.playerId) {
      const asset = await db.asset.findFirst({
        where: { ownerId: actor.playerId, url: String(body.asset_url) },
        select: { id: true },
      })
      assetId = asset?.id || ''
    }
    if (assetId) {
      await requirePartyPlayer()
      const asset = await db.asset.findUnique({ where: { id: assetId }, select: { id: true, ownerId: true } })
      if (!asset || asset.ownerId !== actor.playerId) {
        throw new Error('Uploaded asset not found for current player')
      }
    }
    const post = await createAltarPost({
      playerId: actor.playerId,
      clientSessionId: actor.sessionId,
      displayName: actor.playerName || body.display_name || 'Anonymous',
      anonymous: Boolean(body.anonymous),
      category: body.category,
      tags: body.tags,
      title: body.title,
      body: body.body,
      source: body.source,
      assetId,
    })
    return Response.json({ ok: true, post })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create altar post'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
