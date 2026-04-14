import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** Resolve an adventure slug to its ID. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const adventure = await db.adventure.findUnique({
    where: { slug },
    select: { id: true, startNodeId: true },
  })

  if (!adventure) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ id: adventure.id, startNodeId: adventure.startNodeId })
}
