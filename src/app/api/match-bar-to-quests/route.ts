import { NextRequest, NextResponse } from 'next/server'
import { barsApiAuthError } from '@/lib/bars-api-auth'
import { matchBarToQuests } from '@/lib/bar-forge/match-bar-to-quests'
import { matchBarRequestSchema } from '@/lib/bar-forge/validation'

/**
 * POST /api/match-bar-to-quests
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

  const parsed = matchBarRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const result = await matchBarToQuests(parsed.data)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Match failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
