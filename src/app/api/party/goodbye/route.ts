import { buildGoodbyePayload } from '@/lib/goodbye-party/service'
import { errorResponse, getCurrentPartyActor, withPartySession } from '@/lib/goodbye-party/http'

export const dynamic = 'force-dynamic'

/**
 * Whole-party payload: deck (with both lenses), hand, board, achievements, gates.
 * The client polls this during active play so host edits propagate without any
 * realtime infrastructure.
 */
export async function GET() {
  try {
    const actor = await getCurrentPartyActor()
    const payload = await buildGoodbyePayload(actor.playerId)
    return withPartySession({ ok: true, player_id: actor.playerId, ...payload })
  } catch (error) {
    return errorResponse(error, 'Could not load the party', 500)
  }
}
