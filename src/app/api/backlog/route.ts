import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * @route GET /api/backlog
 * @entity BAR
 * @description List all backlog items (spec-kit BARs) with optional filters
 * @permissions public
 * @query ownerFace:string (optional, filters by owner face)
 * @energyCost 0 (read operation)
 * @dimensions WHO:system, WHAT:BAR, WHERE:backlog
 * @example /api/backlog?ownerFace=architect
 * @agentDiscoverable true
 */
export async function GET(request: Request) {
  try {
    const ownerFace = new URL(request.url).searchParams.get('ownerFace') || undefined
    const where = ownerFace ? { ownerFace } : {}
    const items = await db.specKitBacklogItem.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { id: 'asc' }],
    })
    return NextResponse.json({ items })
  } catch (e) {
    console.error('[GET /api/backlog]', e)
    return NextResponse.json(
      { error: 'Failed to fetch backlog' },
      { status: 500 }
    )
  }
}
