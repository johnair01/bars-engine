import { db } from '@/lib/db'
import { buildPartyDeck, upsertCardOverride } from '@/lib/valkyrie-party/service'
import { requirePartyAdmin } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const actor = await requirePartyAdmin(body.admin_token ? String(body.admin_token) : null)
    let imageAssetId = body.imageAssetId || null
    if (!imageAssetId && body.image_url && actor.playerId) {
      const asset = await db.asset.findFirst({
        where: { ownerId: actor.playerId, url: String(body.image_url) },
        select: { id: true },
      })
      imageAssetId = asset?.id || null
    }
    const override = await upsertCardOverride(actor.playerId, {
      ...body,
      imageAssetId,
    })
    const deck = await buildPartyDeck()
    return Response.json({ ok: true, override, deck })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save card override'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
