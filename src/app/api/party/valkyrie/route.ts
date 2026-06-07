import { buildPartyPayload } from '@/lib/valkyrie-party/service'
import { partyParticipantSummary, withPartySession } from '@/lib/valkyrie-party/http'

export async function GET() {
  try {
    const [payload, current] = await Promise.all([buildPartyPayload(), partyParticipantSummary()])
    return withPartySession({ ok: true, ...payload, current_participant: current })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load party'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
