import { buildPersonalDeck } from '@/lib/valkyrie-party/service'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function GET() {
  try {
    const actor = await requirePartyPlayer()
    const cards = await buildPersonalDeck(actor.playerId!)
    return Response.json({ ok: true, cards })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load personal deck'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
