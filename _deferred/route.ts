import { NextRequest } from 'next/server'
import { handleWikiContentGet, handleWikiContentPut } from '@/lib/wiki/wiki-content-api'

/**
 * GET/PUT /api/wiki/content/handbook/analog-play
 * GET/PUT /api/wiki/content?slug=handbook/analog-play (optional catch-all with empty segments)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug: parts } = await params
  const fromPath = parts?.filter(Boolean).join('/') ?? ''
  const fromQuery = request.nextUrl.searchParams.get('slug')?.trim() ?? ''
  const slug = fromPath || fromQuery
  if (!slug) {
    return Response.json(
      {
        error:
          'Missing slug: use /api/wiki/content/handbook/analog-play or ?slug=handbook/analog-play',
      },
      { status: 400 }
    )
  }
  return handleWikiContentGet(request, slug)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug: parts } = await params
  const fromPath = parts?.filter(Boolean).join('/') ?? ''
  const fromQuery = request.nextUrl.searchParams.get('slug')?.trim() ?? ''
  const slug = fromPath || fromQuery
  if (!slug) {
    return Response.json(
      { error: 'Missing slug path or ?slug= for PUT /api/wiki/content' },
      { status: 400 }
    )
  }
  return handleWikiContentPut(request, slug)
}
