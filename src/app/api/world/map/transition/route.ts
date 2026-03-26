import { NextRequest, NextResponse } from 'next/server'
import { resolveMapTransition } from '@/lib/narrative-os/transitions'
import { isSpaceId } from '@/lib/narrative-os/types'
/**
 * POST /api/world/map/transition
 * Body: `{ fromSpace, toSpace, reason?: string, context?: string }` (reason/context ignored in v0; reserved for logging/persistence later).
 * Mock: deterministic narrative copy + deep links; no persistence (Phase 3).
 * 200 + ok:true on spine (forward, return, stay); 422 + ok:false when no edge on v0 spine (e.g. library→forest).
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const fromSpace = raw.fromSpace
  const toSpace = raw.toSpace

  if (typeof fromSpace !== 'string' || typeof toSpace !== 'string') {
    return NextResponse.json(
      { error: 'fromSpace and toSpace are required strings' },
      { status: 400 }
    )
  }

  if (!isSpaceId(fromSpace) || !isSpaceId(toSpace)) {
    return NextResponse.json(
      { error: 'fromSpace and toSpace must be library | dojo | forest | forge' },
      { status: 400 }
    )
  }

  const result = resolveMapTransition(fromSpace, toSpace)

  const status = result.ok ? 200 : 422
  return NextResponse.json(result, { status })
}
