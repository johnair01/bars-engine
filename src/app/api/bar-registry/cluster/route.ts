import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireForgeBearerOrSession } from '@/lib/bar-forge/forge-or-session'

const clusterRequestSchema = z.object({
  barIds: z.array(z.string().min(1)).min(1),
  strategy: z.enum(['manual', 'heuristic_v1']),
})

const waveKey = (moveType: string | null | undefined): string => {
  const n = (moveType ?? '').toLowerCase()
  if (n.includes('wake')) return 'wake'
  if (n.includes('clean')) return 'clean'
  if (n.includes('grow')) return 'grow'
  if (n.includes('show')) return 'show'
  return 'other'
}

/**
 * POST /api/bar-registry/cluster — deterministic grouping (v1); swap strategy later (spec D8).
 * Auth: Bearer (BARS_API_KEY) or logged-in session.
 */
export async function POST(request: NextRequest) {
  const auth = await requireForgeBearerOrSession(request)
  if (!auth.ok) {
    return auth.response
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = clusterRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { barIds, strategy } = parsed.data

  const bars = await db.customBar.findMany({
    where: { id: { in: barIds } },
    select: { id: true, title: true, moveType: true },
  })

  if (bars.length !== barIds.length) {
    return NextResponse.json({ error: 'One or more bar ids not found' }, { status: 400 })
  }

  if (strategy === 'manual') {
    return NextResponse.json({
      strategy,
      arcs: [
        {
          label: 'manual',
          barIds: [...barIds],
          reason: 'Single arc preserving request order (manual strategy).',
        },
      ],
      revision: { actor: auth.via === 'session' ? auth.playerId : 'bearer', at: new Date().toISOString() },
    })
  }

  const buckets = new Map<string, string[]>()
  for (const b of bars) {
    const k = waveKey(b.moveType)
    const list = buckets.get(k) ?? []
    list.push(b.id)
    buckets.set(k, list)
  }

  const arcs = [...buckets.entries()].map(([label, ids]) => ({
    label,
    barIds: ids,
    reason: `Heuristic: grouped by WAVE hint from moveType (${label}).`,
  }))

  return NextResponse.json({
    strategy,
    arcs,
    revision: { actor: auth.via === 'session' ? auth.playerId : 'bearer', at: new Date().toISOString() },
  })
}
