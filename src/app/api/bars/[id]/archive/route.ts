import { NextResponse } from 'next/server'
import { archiveBar } from '@/actions/interaction-bars'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  const result = await archiveBar(id)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
