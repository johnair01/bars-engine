import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { wikiWriteAuthError } from '@/lib/wiki/wiki-write-auth'
import {
  isAllowedWikiContentSlug,
  WIKI_CONTENT_MAX_CHARS,
} from '@/lib/wiki/wiki-content-allowlist'
import { getWikiPageForApi } from '@/lib/wiki/wiki-page-queries'

export async function handleWikiContentGet(request: NextRequest, slug: string) {
  const authErr = wikiWriteAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  if (!isAllowedWikiContentSlug(slug)) {
    return NextResponse.json({ error: 'Slug not allowed' }, { status: 404 })
  }

  const includeDraft = request.nextUrl.searchParams.get('draft') === '1'
  const row = await getWikiPageForApi(slug, includeDraft)
  if (!row) {
    return NextResponse.json({ error: 'Not found', slug }, { status: 404 })
  }

  return NextResponse.json({
    wikiPage: {
      id: row.id,
      slug: row.slug,
      bodyMarkdown: row.bodyMarkdown,
      status: row.status,
      metadataJson: row.metadataJson,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  })
}

export async function handleWikiContentPut(request: NextRequest, slug: string) {
  const authErr = wikiWriteAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  if (!isAllowedWikiContentSlug(slug)) {
    return NextResponse.json({ error: 'Slug not allowed' }, { status: 400 })
  }

  let body: { markdown?: string; status?: string; metadata?: Record<string, unknown> }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const markdown = body.markdown
  if (typeof markdown !== 'string') {
    return NextResponse.json({ error: 'markdown (string) is required' }, { status: 400 })
  }
  if (markdown.length > WIKI_CONTENT_MAX_CHARS) {
    return NextResponse.json(
      { error: `markdown exceeds max length (${WIKI_CONTENT_MAX_CHARS})` },
      { status: 400 }
    )
  }

  const status = body.status ?? 'pending_review'
  if (!['draft', 'pending_review', 'published'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const metadataJson =
    body.metadata !== undefined
      ? JSON.stringify(body.metadata)
      : JSON.stringify({ source: 'wiki_write_api', at: new Date().toISOString() })

  const saved = await db.wikiPageContent.upsert({
    where: { slug },
    create: {
      slug,
      bodyMarkdown: markdown,
      status,
      metadataJson,
    },
    update: {
      bodyMarkdown: markdown,
      status,
      metadataJson,
    },
  })

  revalidatePath(`/wiki/${slug}`)

  return NextResponse.json({
    ok: true,
    wikiPage: {
      id: saved.id,
      slug: saved.slug,
      status: saved.status,
      updatedAt: saved.updatedAt.toISOString(),
    },
  })
}
