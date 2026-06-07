import { buildInbox } from '@/lib/valkyrie-party/service'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function GET() {
  try {
    const actor = await requirePartyPlayer()
    const inbox = await buildInbox(actor.playerId!)
    return Response.json({ ok: true, ...inbox })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load inbox'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
