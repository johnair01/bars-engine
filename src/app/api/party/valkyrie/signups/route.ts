import { NextResponse } from 'next/server'
import { joinParty } from '@/lib/valkyrie-party/service'
import { getPartySessionId, setPartyPlayerCookie, withPartySession } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionId = await getPartySessionId()
    const result = await joinParty({
      displayName: String(body.name || ''),
      email: body.email ? String(body.email) : '',
      keepPartyData: body.keep_party_data !== false,
      wantsFullSignup: Boolean(body.wants_full_signup),
      clientSessionId: sessionId || undefined,
    })

    const response = await withPartySession({
      ok: true,
      signup: {
        id: result.participant.id,
        name: result.participant.displayName,
        email: result.participant.email || '',
        wants_full_signup: result.participant.wantsFullSignup,
        keep_party_data: result.participant.keepPartyData,
      },
    })
    setPartyPlayerCookie(response, result.playerId)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not join party'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
