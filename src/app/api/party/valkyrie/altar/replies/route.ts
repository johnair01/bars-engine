import { createAltarReply } from '@/lib/valkyrie-party/service'
import { getCurrentPartyActor } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const actor = await getCurrentPartyActor()
    const body = await request.json()
    const reply = await createAltarReply({
      playerId: actor.playerId,
      clientSessionId: actor.sessionId,
      displayName: actor.playerName || body.display_name || 'Anonymous',
      anonymous: Boolean(body.anonymous),
      postId: body.post_id,
      body: body.body,
    })
    return Response.json({ ok: true, reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not reply'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
