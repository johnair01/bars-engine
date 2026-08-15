import { buildGoodbyePayload, upsertGoodbyeCardOverride } from '@/lib/goodbye-party/service'
import { errorResponse, requirePartyAdmin } from '@/lib/goodbye-party/http'

/**
 * Live Game Master patch layer. Writes the same `PartyOracleCardOverride` rows
 * the Valkyrie admin uses, keyed per lens, so a bad generated reading can be
 * repaired mid-party. Clients pick it up on their next poll.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const actor = await requirePartyAdmin(body.admin_token ? String(body.admin_token) : null)
    const override = await upsertGoodbyeCardOverride(actor.playerId, body)
    const payload = await buildGoodbyePayload(actor.playerId)
    return Response.json({ ok: true, override_card_id: override.cardId, ...payload })
  } catch (error) {
    return errorResponse(error, 'Could not save that card edit')
  }
}
