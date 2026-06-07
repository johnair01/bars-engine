import { buildAdminDeckMap } from '@/lib/valkyrie-party/service'
import { requirePartyAdmin } from '@/lib/valkyrie-party/http'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    await requirePartyAdmin(searchParams.get('admin_token'))
    const cards = await buildAdminDeckMap()
    return Response.json({ ok: true, cards })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load admin deck map'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
