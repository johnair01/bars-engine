import { NextResponse } from 'next/server'
import { moveQuestToGraveyard } from '@/actions/nation-moves'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ questId: string }> }
) {
  const { questId } = await ctx.params
  const body = await req.json().catch(() => ({} as any))

  const confirm =
    body?.confirm_cost_paid === true ||
    body?.confirmCostPaid === true

  const result = await moveQuestToGraveyard(questId, confirm)

  if ('error' in result) {
    return NextResponse.json({ status: 'error', error: result.error }, { status: 400 })
  }

  return NextResponse.json({ status: 'ok' })
}

