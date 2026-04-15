import { NextResponse } from 'next/server'
import { getBarFeed } from '@/actions/interaction-bars'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const campaignRef = searchParams.get('campaignRef') ?? undefined
  const barTypes = searchParams.get('barTypes')?.split(',').filter(Boolean) ?? undefined
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const result = await getBarFeed({
    campaignRef,
    barTypes,
    statuses,
    limit,
    offset,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
