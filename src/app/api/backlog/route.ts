import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const items = await db.specKitBacklogItem.findMany({
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
