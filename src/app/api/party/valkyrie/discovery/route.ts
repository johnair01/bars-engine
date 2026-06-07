import { buildDiscoveryDeck, recordDiscovery } from '@/lib/valkyrie-party/service'
import { getCurrentPartyActor, requirePartyPlayer, requirePartyAdmin } from '@/lib/valkyrie-party/http'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminToken = searchParams.get('admin_token')
    const actor = await getCurrentPartyActor()
    const isAdmin = adminToken ? Boolean(await requirePartyAdmin(adminToken).catch(() => null)) : false
    if (!actor.playerId) {
      return Response.json({ ok: true, discovered_count: 0, total_cards: 0, cards: [] })
    }
    const deck = await buildDiscoveryDeck(actor.playerId, isAdmin)
    return Response.json({ ok: true, ...deck })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load discoveries'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const row = await recordDiscovery(actor.playerId!, String(body.base_card_id || ''), String(body.source || 'draw'))
    return Response.json({ ok: true, discovery: row })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not record discovery'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
