import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { booksContextAuthError } from '@/lib/books-context-api-auth'
import {
  BOOK_CHUNK_TAGS_MAX_PER_REQUEST,
  isValidGameMasterFace,
  validateChunkTagRow,
  type ChunkTagInput,
} from '@/lib/book-chunk-tags-validation'

/**
 * GET /api/admin/books/[id]/chunk-tags
 * List Sage-slice tags (deterministic char ranges + GM face + optional hexagram).
 * Query: face — optional filter (shaman|challenger|regent|architect|diplomat|sage)
 *
 * PUT /api/admin/books/[id]/chunk-tags
 * Full replace of all chunk tags for this book (body: { tags: [...] }).
 * Auth: same as Books context API (Bearer BOOKS_CONTEXT_API_KEY).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = booksContextAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  const { id: bookId } = await params
  const faceRaw = request.nextUrl.searchParams.get('face')?.trim().toLowerCase() ?? null

  const book = await db.book.findUnique({ where: { id: bookId }, select: { id: true } })
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const where: { bookId: string; gameMasterFace?: string } = { bookId }
  if (faceRaw) {
    if (!isValidGameMasterFace(faceRaw)) {
      return NextResponse.json(
        { error: 'Invalid face: use shaman|challenger|regent|architect|diplomat|sage' },
        { status: 400 }
      )
    }
    where.gameMasterFace = faceRaw
  }

  const rows = await db.bookChunkTag.findMany({
    where,
    orderBy: [{ charStart: 'asc' }],
    select: {
      id: true,
      charStart: true,
      charEnd: true,
      gameMasterFace: true,
      hexagramId: true,
      metadataJson: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({
    bookId,
    count: rows.length,
    tags: rows.map((r) => ({
      id: r.id,
      charStart: r.charStart,
      charEnd: r.charEnd,
      gameMasterFace: r.gameMasterFace,
      hexagramId: r.hexagramId,
      metadata: r.metadataJson ? safeParseJson(r.metadataJson) : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = booksContextAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  const { id: bookId } = await params
  const book = await db.book.findUnique({ where: { id: bookId }, select: { id: true } })
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const tagsRaw = (body as { tags?: unknown }).tags
  if (!Array.isArray(tagsRaw)) {
    return NextResponse.json({ error: 'Body must include tags: array' }, { status: 400 })
  }
  if (tagsRaw.length > BOOK_CHUNK_TAGS_MAX_PER_REQUEST) {
    return NextResponse.json(
      { error: `At most ${BOOK_CHUNK_TAGS_MAX_PER_REQUEST} tags per request` },
      { status: 400 }
    )
  }

  const parsed: ChunkTagInput[] = []
  for (let i = 0; i < tagsRaw.length; i++) {
    const v = validateChunkTagRow(tagsRaw[i], i)
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 })
    }
    parsed.push(v.value)
  }

  // Dedupe (bookId, charStart, charEnd) — last wins
  const seen = new Map<string, ChunkTagInput>()
  for (const t of parsed) {
    const key = `${t.charStart}:${t.charEnd}`
    seen.set(key, t)
  }
  const unique = [...seen.values()]

  await db.$transaction(async (tx) => {
    await tx.bookChunkTag.deleteMany({ where: { bookId } })
    if (unique.length === 0) return
    await tx.bookChunkTag.createMany({
      data: unique.map((t) => ({
        bookId,
        charStart: t.charStart,
        charEnd: t.charEnd,
        gameMasterFace: t.gameMasterFace,
        hexagramId: t.hexagramId ?? null,
        metadataJson:
          t.metadata != null && Object.keys(t.metadata).length > 0
            ? JSON.stringify(t.metadata)
            : null,
      })),
    })
  })

  const count = await db.bookChunkTag.count({ where: { bookId } })

  return NextResponse.json({
    ok: true,
    bookId,
    count,
    message: 'Chunk tags replaced for this book',
  })
}

function safeParseJson(s: string): unknown {
  try {
    return JSON.parse(s) as unknown
  } catch {
    return null
  }
}
