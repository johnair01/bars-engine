import { listAltarSaves, saveAltarPost } from '@/lib/valkyrie-party/service'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

export async function GET() {
  try {
    const actor = await requirePartyPlayer()
    const saves = await listAltarSaves(actor.playerId!)
    return Response.json({ ok: true, saves })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load saves'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePartyPlayer()
    const body = await request.json()
    const save = await saveAltarPost(actor.playerId!, String(body.artifact_id || ''), String(body.note || ''))
    return Response.json({ ok: true, save })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save keepsake'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
