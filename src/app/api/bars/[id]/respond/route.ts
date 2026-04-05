import { NextResponse } from 'next/server'
import { respondToBar } from '@/actions/interaction-bars'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const { responseType, message } = body

  if (!responseType) {
    return NextResponse.json(
      { error: 'responseType is required' },
      { status: 400 }
    )
  }

  const result = await respondToBar(id, {
    responseType,
    message,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
