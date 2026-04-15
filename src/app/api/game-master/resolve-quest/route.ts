import { NextRequest, NextResponse } from 'next/server'
import { barsApiAuthError } from '@/lib/bars-api-auth'
import { resolveQuestRequestSchema } from '@/lib/game-master-quest/schemas'
import { resolveQuestForPlayer } from '@/lib/game-master-quest/resolve-quest'

/**
 * POST /api/game-master/resolve-quest
 * Bearer: BARS_API_KEY
 */
export async function POST(request: NextRequest) {
  const authErr = barsApiAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = resolveQuestRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const out = await resolveQuestForPlayer(parsed.data)
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: out.status })
    }
    return NextResponse.json({
      collective: out.collective,
      player: out.player,
      proposals: out.proposals,
      meta: out.meta,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Resolve failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
