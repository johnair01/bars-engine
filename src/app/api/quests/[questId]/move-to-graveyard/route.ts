/**
 * @route POST /api/quests/:questId/move-to-graveyard
 * @entity QUEST
 * @description Archive a quest to graveyard (requires cost confirmation)
 * @permissions owner
 * @params questId:string (path, required) - Quest identifier
 * @params confirm_cost_paid:boolean (body, required) - Cost confirmation flag
 * @relationships QUEST (CustomBar status), PLAYER (owner)
 * @energyCost 1
 * @dimensions WHO:owner, WHAT:quest archival, WHERE:graveyard, ENERGY:closure ritual
 * @example POST /api/quests/quest123/move-to-graveyard with {confirm_cost_paid:true}
 * @agentDiscoverable true
 */
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

