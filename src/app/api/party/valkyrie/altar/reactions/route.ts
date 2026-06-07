import { toggleAltarReaction } from '@/lib/valkyrie-party/service'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const result = await toggleAltarReaction(actor.playerId!, String(body.post_id || ''), String(body.reaction || ''))
    return Response.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not react'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
