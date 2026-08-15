import { joinGoodbyeParty } from '@/lib/goodbye-party/service'
import {
  ensurePartySessionId,
  errorResponse,
  setPartyPlayerCookie,
  withPartySession,
} from '@/lib/goodbye-party/http'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Mint the session here if the browser does not have one yet, so joining
    // never depends on a prior successful party load.
    const sessionId = await ensurePartySessionId()
    const result = await joinGoodbyeParty({
      displayName: String(body.name || ''),
      email: body.email ? String(body.email) : '',
      keepPartyData: body.keep_party_data !== false,
      wantsFullSignup: Boolean(body.wants_full_signup),
      clientSessionId: sessionId,
    })

    const response = await withPartySession(
      {
        ok: true,
        player: { id: result.playerId, name: result.participant.displayName },
      },
      sessionId,
    )
    setPartyPlayerCookie(response, result.playerId)
    return response
  } catch (error) {
    return errorResponse(error, 'Could not join the party')
  }
}
