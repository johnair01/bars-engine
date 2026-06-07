import { answerCardThread } from '@/lib/valkyrie-party/service'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const { threadId } = await params
    const thread = await answerCardThread(actor.playerId!, threadId, {
      answer_text: body.answer_text,
      private_note: body.private_note,
    })
    return Response.json({ ok: true, thread })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not answer card'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
