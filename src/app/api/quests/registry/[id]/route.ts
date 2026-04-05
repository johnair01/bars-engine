import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireForgeBearerOrSession } from '@/lib/bar-forge/forge-or-session'
import { registryRowToResponse } from '@/lib/generated-quest-registry/to-response'

/**
 * GET /api/quests/registry/[id] — fetch a persisted generated quest by registry id.
 * Auth: Bearer (BARS_API_KEY) or logged-in session.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireForgeBearerOrSession(request)
  if (!auth.ok) {
    return auth.response
  }

  const { id } = await context.params
  const row = await db.generatedQuestRegistry.findUnique({ where: { id } })
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(registryRowToResponse(row))
}
