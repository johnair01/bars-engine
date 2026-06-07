import { buildPartyDeck, updatePartySchedule } from '@/lib/valkyrie-party/service'
import { requirePartyAdmin } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await requirePartyAdmin(body.admin_token ? String(body.admin_token) : null)
    await updatePartySchedule(body)
    const deck = await buildPartyDeck()
    return Response.json({ ok: true, deck })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update schedule'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
