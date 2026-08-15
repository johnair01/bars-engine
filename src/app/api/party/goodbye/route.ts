import { buildGoodbyePayload } from '@/lib/goodbye-party/service'
import {
  errorResponseWithSession,
  getCurrentPartyActor,
  withPartySession,
} from '@/lib/goodbye-party/http'

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
    // Still hand back a session cookie — a guest must be able to join even
    // when the party payload is broken.
    return errorResponseWithSession(error, 'Could not load the party')
  }
}
