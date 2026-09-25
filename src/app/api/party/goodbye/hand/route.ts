import {
  buildGoodbyePayload,
  getGoodbyePartyId,
  isDepth,
  isLens,
  resolveCard,
} from '@/lib/goodbye-party/service'
import { errorResponse, requirePartyPlayer } from '@/lib/goodbye-party/http'

/**
 * Play or Discard. Both resolve the base card for the player's current cycle and
 * immediately replenish the hand to three; Play additionally lands on the shared
 * board. The midnight Spicy gate is enforced here, not only in the client.
 */
export async function POST(request: Request) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const action = body.action === 'discard' ? 'discard' : 'play'
    const lens = isLens(body.lens) ? body.lens : 'goodbye'
    const depth = isDepth(body.depth) ? body.depth : 'easy'
    const cardId = String(body.card_id || '')
    if (!cardId) throw new Error('card_id is required')

    const partyId = await getGoodbyePartyId()
    const result = await resolveCard({
      partyId,
      playerId: actor.playerId,
      cardId,
      lens,
      depth,
      action,
    })
    const payload = await buildGoodbyePayload(actor.playerId)
    return Response.json({ ok: true, play_event_id: result.playEventId, ...payload })
  } catch (error) {
    return errorResponse(error, 'Could not resolve that card')
  }
}
