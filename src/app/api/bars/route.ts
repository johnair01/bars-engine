import { NextResponse } from 'next/server'
import { createInteractionBar, listBars } from '@/actions/interaction-bars'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const campaignRef = searchParams.get('campaignRef') ?? undefined
  const barType = searchParams.get('barType') ?? undefined
  const barTypes = searchParams.get('barTypes')?.split(',') ?? undefined
  const visibility = searchParams.get('visibility') as 'private' | 'public' | undefined
  const creatorId = searchParams.get('creatorId') ?? undefined
  const parentId = searchParams.get('parentId') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const statuses = searchParams.get('statuses')?.split(',') ?? undefined

  const result = await listBars({
    campaignRef,
    barType: barTypes ?? barType,
    visibility,
    creatorId,
    parentId,
    status: statuses ?? status,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const {
    barType,
    title,
    description,
    visibility = 'public',
    payload = {},
    parentId,
    campaignRef,
  } = body

  if (!barType || !title || !description) {
    return NextResponse.json(
      { error: 'barType, title, and description are required' },
      { status: 400 }
    )
  }

  const result = await createInteractionBar({
    barType,
    title,
    description,
    visibility: visibility === 'private' ? 'private' : 'public',
    payload: typeof payload === 'object' ? payload : {},
    parentId: parentId || undefined,
    campaignRef: campaignRef || undefined,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
