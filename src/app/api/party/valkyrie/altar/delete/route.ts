import { deleteOwnAltarItem } from '@/lib/valkyrie-party/service'
import { getCurrentPartyActor } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const actor = await getCurrentPartyActor()
    const body = await request.json()
    const deleted = await deleteOwnAltarItem({
      playerId: actor.playerId,
      clientSessionId: actor.sessionId || undefined,
      postId: body.post_id ? String(body.post_id) : undefined,
      replyId: body.reply_id ? String(body.reply_id) : undefined,
    })
    return Response.json({ ok: true, deleted })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete altar item'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
