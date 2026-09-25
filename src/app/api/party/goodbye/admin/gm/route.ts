import {
  buildGoodbyePayload,
  featureGmCard,
  getGoodbyePartyId,
  hideBoardPlay,
  unlockNextGmCard,
} from '@/lib/goodbye-party/service'
import { errorResponse, requirePartyAdmin } from '@/lib/goodbye-party/http'

/**
 * The four host controls the one-shot needs: feature an unlocked GM card,
 * unlock the next one early, and hide a board play. Card copy edits live in
 * ../card-override. No general permissions system.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const actor = await requirePartyAdmin(body.admin_token ? String(body.admin_token) : null)
    const partyId = await getGoodbyePartyId()

    let result: Record<string, unknown>
    if (body.action === 'feature') {
      result = await featureGmCard(partyId, actor.playerId, Number(body.slot))
    } else if (body.action === 'unlock_next') {
      result = await unlockNextGmCard(partyId, actor.playerId)
    } else if (body.action === 'hide_play') {
      const playEventId = String(body.play_event_id || '')
      if (!playEventId) throw new Error('play_event_id is required')
      result = await hideBoardPlay(partyId, actor.playerId, playEventId)
    } else {
      throw new Error('Unknown host action')
    }

    const payload = await buildGoodbyePayload(actor.playerId)
    return Response.json({ ok: true, ...result, ...payload })
  } catch (error) {
    return errorResponse(error, 'Could not run that host action')
  }
}
