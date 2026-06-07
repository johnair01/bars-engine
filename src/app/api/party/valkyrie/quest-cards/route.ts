import { buildPartyDeck, createQuestCard } from '@/lib/valkyrie-party/service'
import { getCurrentPartyActor } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const actor = await getCurrentPartyActor()
    const body = await request.json()
    const card = await createQuestCard(actor.playerId, body)
    const deck = await buildPartyDeck()
    return Response.json({ ok: true, card, deck })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create quest card'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
