import { adminDeleteAltarItem } from '@/lib/valkyrie-party/service'
import { requirePartyAdmin } from '@/lib/valkyrie-party/http'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await requirePartyAdmin(body.admin_token ? String(body.admin_token) : null)
    const deleted = await adminDeleteAltarItem({
      postId: body.post_id ? String(body.post_id) : undefined,
      replyId: body.reply_id ? String(body.reply_id) : undefined,
    })
    return Response.json({ ok: true, deleted })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not admin delete altar item'
    return Response.json({ ok: false, error: message }, { status: 400 })
  }
}
