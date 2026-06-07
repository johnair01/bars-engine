import { createCardThread } from '@/lib/valkyrie-party/service'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const thread = await createCardThread(actor.playerId!, {
      base_card_id: body.base_card_id,
      recipient_name: body.recipient_name,
      sender_note: body.sender_note,
    })
    return Response.json({ ok: true, thread })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not send card'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
