import { db } from '@/lib/db'
import { createQuestCompletion } from '@/lib/valkyrie-party/service'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function POST(request: Request, { params }: { params: Promise<{ questCardId: string }> }) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const { questCardId } = await params
    let assetId: string | null = body.asset_id || null
    if (!assetId && body.asset_url) {
      const asset = await db.asset.findFirst({
        where: { ownerId: actor.playerId!, url: String(body.asset_url) },
        select: { id: true },
      })
      assetId = asset?.id || null
    }
    const completion = await createQuestCompletion(actor.playerId!, questCardId, assetId, body.caption || '')
    return Response.json({ ok: true, completion })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save quest completion'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
