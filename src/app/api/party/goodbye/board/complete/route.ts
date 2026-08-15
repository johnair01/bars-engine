import { buildGoodbyePayload, completePlay, getGoodbyePartyId } from '@/lib/goodbye-party/service'
import { errorResponse, requirePartyPlayer } from '@/lib/goodbye-party/http'

/**
 * "I did this". Optional and never penalized — a play may stay Active all night.
 * Completion is what unlocks the reading's achievement, and (on Hard) attempts
 * the BAR capture, which is allowed to fail without failing the completion.
 */
export async function POST(request: Request) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const playEventId = String(body.play_event_id || '')
    if (!playEventId) throw new Error('play_event_id is required')

    const partyId = await getGoodbyePartyId()
    const result = await completePlay({
      partyId,
      playerId: actor.playerId,
      playEventId,
      note: body.note ? String(body.note) : '',
    })
    const payload = await buildGoodbyePayload(actor.playerId)
    return Response.json({
      ok: true,
      already_completed: result.alreadyCompleted,
      achievement: result.achievement,
      bar_id: result.barId,
      ...payload,
    })
  } catch (error) {
    return errorResponse(error, 'Could not record that completion')
  }
}
