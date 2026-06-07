import { exportAltar } from '@/lib/valkyrie-party/service'
import { requirePartyAdmin } from '@/lib/valkyrie-party/http'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    await requirePartyAdmin(searchParams.get('admin_token'))
    const payload = await exportAltar()
    return Response.json({ ok: true, ...payload })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not export altar'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
