import { NextResponse } from 'next/server'
import { applyNationMoveWithState } from '@/actions/nation-moves'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ questId: string }> }
) {
  const { questId } = await ctx.params
  const body = await req.json().catch(() => ({} as any))

  const moveKey = typeof body?.moveKey === 'string' ? body.moveKey : ''
  const inputs = body?.inputs && typeof body.inputs === 'object' ? body.inputs : {}

  const form = new FormData()
  form.set('questId', questId)
  form.set('moveKey', moveKey)
  for (const [k, v] of Object.entries(inputs)) {
    if (v == null) continue
    form.set(k, String(v))
  }

  const result = await applyNationMoveWithState(null, form)
  if ('error' in result) {
    return NextResponse.json({ status: 'error', error: result.error }, { status: 400 })
  }

  return NextResponse.json({ status: 'ok', ...result })
}

