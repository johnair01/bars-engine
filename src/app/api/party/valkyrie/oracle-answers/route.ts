import { createOracleAnswer } from '@/lib/valkyrie-party/service'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const answer = await createOracleAnswer(actor.playerId!, {
      baseCardId: body.base_card_id,
      depth: body.depth,
      scope: body.scope,
      answerText: body.answer_text,
    })
    return Response.json({ ok: true, answer })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save answer'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
